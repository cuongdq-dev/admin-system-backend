import {
  Book,
  Category,
  Chapter,
  Media,
  Site,
  SiteBook,
  StorageType,
  User,
} from '@app/entities';
import { BookStatus } from '@app/entities/book.entity';
import * as cheerio from 'cheerio';

import { IndexStatus } from '@app/entities/site_books.entity';
import { callGeminiApi, generateSlug, uploadImageCdn } from '@app/utils';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import * as path from 'path';
import { DataSource, In, Repository } from 'typeorm';
import { CreateBookDto } from './book.dto';
import { CrawlService } from '@app/modules/crawl-data/crawl.service';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book) private bookRepository: Repository<Book>,
    @InjectRepository(Chapter) private chapterRepository: Repository<Chapter>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,

    @InjectRepository(Site) private siteRepository: Repository<Site>,
    @InjectRepository(Media) private mediaRepository: Repository<Media>,

    @InjectRepository(SiteBook)
    private siteBookRepository: Repository<SiteBook>,

    private readonly dataSource: DataSource,

    private readonly crawlService: CrawlService,
  ) {}

  async getAll(query: PaginateQuery & Record<string, any>) {
    const bookQb = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.thumbnail', 'thumbnail')
      .innerJoin('book.chapters', 'chapters')
      .loadRelationCountAndMap('book.chapter_count', 'book.chapters') // ✅ đếm số chương
      .select([
        'book.id',
        'book.title',
        'book.slug',
        'book.is_new',
        'book.is_hot',
        'book.word_count',
        'book.voice_count',
        'book.is_full',
        'book.total_chapter',
        'book.source_url',
        'book.description',
        'book.social_description',
        'book.author',
        'book.created_at',
        'thumbnail.id',
        'thumbnail.url',
        'thumbnail.slug',
      ])
      .groupBy('book.id')
      .orderBy('book.created_at', 'DESC')
      .addGroupBy('thumbnail.id');

    if (query?.status?.length) {
      bookQb.andWhere('book.status IN (:...status)', { status: query.status });
    } else {
      bookQb.andWhere('book.status IN (:...status)', {
        status: ['NEW', 'DRAFT', 'PUBLISHED'],
      });
    }
    if (query?.search) {
      bookQb.andWhere(`unaccent(LOWER(book.title)) ILIKE unaccent(:search)`, {
        search: `%${query.search}%`,
      });
    }

    if (query?.source) {
      bookQb.andWhere(
        `unaccent(LOWER(book.source_url)) ILIKE unaccent(:source_url)`,
        {
          source_url: `%${query.source}%`,
        },
      );
    }

    return await paginate(
      { ...query, filter: { ...query.filter, source: query.source } },
      bookQb,
      {
        sortableColumns: ['created_at'],
        defaultSortBy: [['created_at', 'DESC']],
        maxLimit: 500,
        defaultLimit: 20,
      },
    );
  }

  async getBookBySlug(slugOrId: string, user: User) {
    const query = this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.chapters', 'chapter')
      .leftJoinAndSelect('book.siteBooks', 'sites')
      .leftJoinAndSelect('book.categories', 'category')
      .leftJoinAndSelect('book.thumbnail', 'thumbnail')
      .where(
        isUUID(slugOrId) ? 'book.id = :slugOrId' : 'book.slug = :slugOrId',
        {
          slugOrId,
        },
      )
      .orderBy('chapter.chapter_number', 'ASC');

    const result = await query.getOne();
    const sites =
      result?.siteBooks &&
      (await this.siteRepository.find({
        where: {
          id: In(result?.siteBooks?.map((st) => st.site_id)),
          created_by: user.id,
        },
      }));

    return {
      ...result,
      sites: sites,
      chapters: result?.chapters?.map((chapter) => {
        return {
          ...chapter,
          word_count: chapter?.content?.length || 0,
          voice_count: chapter?.voice_content?.length || 0,
        };
      }),
    };
  }

  async chapterGenerateGemini(book: Book, user: User, chapterSlug?: string) {
    // Cập nhật trạng thái bắt đầu generate
    await this.bookRepository.update(
      { id: book.id },
      { status: BookStatus.AI_GENERATE },
    );

    // Chạy dưới nền
    setImmediate(async () => {
      try {
        const chapters = book.chapters;

        if (!chapters.length) {
          console.warn(`Book ${book.id} has no chapters`);
          return;
        }

        // Nếu có chapterSlug → chỉ xử lý 1 chương
        const targetChapters = chapterSlug
          ? chapters.filter((ch) => ch.slug === chapterSlug)
          : chapters;

        if (!targetChapters.length) {
          console.warn(
            `Chapter with slug "${chapterSlug}" not found in book ${book.id}`,
          );
          return;
        }

        for (const chapter of targetChapters) {
          const content = cheerio.load(chapter.content).text();
          const geminiResult = await this.crawlService.generateGeminiChapter(
            book,
            content,
            chapter.chapter_number,
            book.source_url,
          );
          if (!geminiResult) continue;
        }
      } catch (error) {
        console.error('Gemini generation failed:', error);
      } finally {
        // ✅ Luôn cập nhật lại status về PUBLISHED (kể cả lỗi)
        await this.bookRepository.update(
          { id: book.id },
          { status: BookStatus.PUBLISHED },
        );
      }
    });

    // Trả về dữ liệu book hiện tại
    const data = await this.getBookBySlug(book.id, user);
    return { ...data };
  }

  async crawlerBook(id: string) {
    const book = await this.bookRepository.findOne({
      where: { id: id },
      relations: ['chapters', 'thumbnail'],
    });

    const result = await this.bookRepository.findOne({
      where: { id: id },
      relations: ['chapters', 'thumbnail'],
    });
    return result;
  }

  async create(body: CreateBookDto, thumbnail?: Express.Multer.File) {
    const [categories] = await Promise.all([
      this.categoryRepository.find({
        where: { id: In(body?.categories?.map((cate) => cate?.id)) },
      }),
    ]);

    const data = {
      title: body.title,
      slug: generateSlug(body.title),
      created_by: body?.created_by,
      meta_description: body?.meta_description,
      categories: categories,
      user_id: body?.created_by,
    } as Book;

    const result = await this.bookRepository.create(data).save();

    if (result.id && body?.sites?.length > 0) {
      const siteBooks = body?.sites?.map((site) => {
        return { site_id: site.id, book_id: result.id };
      });
      await this.siteBookRepository.insert(siteBooks);
    }

    if (result.id && thumbnail) {
      const base64Image = thumbnail.buffer.toString('base64');
      const mediaEntity = {
        data: `data:image/png;base64, ${base64Image}`,
        filename: thumbnail.originalname,
        slug: generateSlug(path.parse(thumbnail.originalname).name),
        mimetype: thumbnail.mimetype,
        size: thumbnail.size,
        storage_type: StorageType.BASE64,
        url: '',
      };

      const cdnResult = await uploadImageCdn(mediaEntity);

      if (!!cdnResult.url) {
        mediaEntity.url = process.env.CDN_DOMAIN + cdnResult?.url;
        mediaEntity.storage_type = StorageType.LOCAL;
        mediaEntity.data = null;
      }
      const thumbnailResult = await this.mediaRepository.upsert(
        { ...mediaEntity, deleted_at: null, deleted_by: null },
        {
          conflictPaths: ['slug'],
        },
      );

      await this.bookRepository.update(
        { id: result.id },
        { thumbnail_id: thumbnailResult.generatedMaps[0]?.id },
      );
    }

    return body;
  }

  async update(
    id: string,
    body: CreateBookDto,
    user: User,
    thumbnail?: Express.Multer.File,
  ) {
    const { categories, status, sites, keywords, ...values } = body;
    const dataToUpdate = {
      ...values,
      updated_by: body.updated_by,
    };

    if (status) dataToUpdate['status'] = body.status;
    if (categories) {
      const categories = await this.categoryRepository.find({
        where: { id: In(body?.categories?.map((cate) => cate.id)) },
      });
      dataToUpdate['categories'] = categories;
    }
    if (sites) {
      const sites = await this.siteRepository.find({
        where: {
          id: In(body?.sites?.map((site) => site.id)),
          created_by: user.id,
        },
        select: ['id'],
      });

      dataToUpdate['siteBooks'] = sites.map((site) => {
        return {
          site_id: site.id,
          book_id: id,
          indexStatus: IndexStatus.NEW,
          created_by: user.id,
        };
      });
    }
    if (keywords) {
      dataToUpdate['keywords'] = body?.keywords.map((query) => {
        return { slug: generateSlug(query.title), query: query.title };
      });
    }
    if (thumbnail) {
      const base64Image = thumbnail.buffer.toString('base64');
      const mediaEntity = {
        data: `data:image/png;base64, ${base64Image}`,
        filename: thumbnail.originalname,
        slug: generateSlug(path.parse(thumbnail.originalname).name),
        mimetype: thumbnail.mimetype,
        size: thumbnail.size,
        storage_type: StorageType.BASE64,
        url: '',
      };

      const cdnResult = await uploadImageCdn(mediaEntity);

      if (!!cdnResult.url) {
        mediaEntity.url = process.env.CDN_DOMAIN + cdnResult?.url;
        mediaEntity.storage_type = StorageType.LOCAL;
        mediaEntity.data = null;
      }
      const thumbnailResult = await this.mediaRepository.upsert(
        { ...mediaEntity, deleted_at: null, deleted_by: null },
        {
          conflictPaths: ['slug'],
        },
      );

      dataToUpdate['thumbnail_id'] = thumbnailResult.generatedMaps[0].id;
    }

    await this.dataSource.transaction(async (manager) => {
      if (dataToUpdate['siteBooks']) {
        await manager.delete(SiteBook, { book_id: id });
        await manager.insert(SiteBook, dataToUpdate['siteBooks']);
      }
      await manager.save(Book, {
        ...dataToUpdate,
        id: id,
        siteBooks: undefined,
      });
    });

    const result = await this.bookRepository.findOne({
      where: { id: id },
      relations: [
        'user',
        'thumbnail',
        'categories',
        'siteBooks',
        'siteBooks.site',
      ],
    });

    return {
      ...result,

      categories: await this.categoryRepository.find({
        where: {
          books: { id: id }, // Liên kết qua bài viết
          created_by: user.id, // Điều kiện lọc theo user
        },
        relations: ['books'], // Nếu cần quan hệ với bài viết
      }),
      siteBooks: null,
      sites: await this.siteRepository.find({
        where: {
          id: In(result?.siteBooks?.map((st) => st.site_id)), // Liên kết qua bài viết
        },
      }),
    };
  }

  async delete(book: Book) {
    if (book.status == BookStatus.DELETED) {
      throw new BadRequestException('Books already deleted!');
    }

    const checkUsed = await this.siteBookRepository.findOne({
      where: { book_id: book.id },
      relations: ['site'],
    });
    if (checkUsed) {
      throw new BadRequestException(
        'Some Books in this trending are currently in use by sites. Cannot delete!',
      );
    }
    // await this.deletePostUnused(post);
  }
}
