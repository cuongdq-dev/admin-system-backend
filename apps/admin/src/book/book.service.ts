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

import { IndexStatus } from '@app/entities/site_books.entity';
import { generateSlug, uploadImageCdn } from '@app/utils';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import * as path from 'path';
import { DataSource, In, Repository } from 'typeorm';
import { CreateBookDto } from './book.dto';

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
  ) {}

  async getAll(query: PaginateQuery & Record<string, any>) {
    const bookQb = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.thumbnail', 'thumbnail')
      .leftJoinAndSelect('book.categories', 'categories')
      .leftJoinAndSelect('book.siteBooks', 'siteBooks')
      .leftJoinAndSelect('book.chapters', 'chapters')
      .leftJoinAndSelect('siteBooks.site', 'sb_site')
      .leftJoinAndSelect('siteBooks.book', 'sb_book')
      .loadRelationCountAndMap('book.chapter_count', 'book.chapters') // ✅ đếm số chương
      .select([
        'book.id',
        'book.title',
        'book.slug',
        'book.is_new',
        'book.is_hot',
        'book.is_full',
        'book.total_chapter',
        'book.source_url',
        'book.description',
        'book.author',
        'book.created_at',
        'thumbnail.id',
        'thumbnail.url',
        'thumbnail.slug',

        'categories.id',
        'categories.slug',
        'categories.name',

        'sb_site.id',
        'sb_site.name',
        'sb_site.domain',
        'sb_site.created_at',

        'sb_book.id',
        'sb_book.title',
        'sb_book.slug',
        'sb_book.created_at',

        'chapters.id',
        'chapters.slug',
        'chapters.title',
        'chapters.content',
      ])
      .groupBy('book.id')
      .addGroupBy('thumbnail.id')
      .addGroupBy('chapters.id')
      .addGroupBy('siteBooks.id')
      .addGroupBy('categories.id')
      .addGroupBy('sb_site.id')
      .addGroupBy('sb_book.id');
    if (query?.site_id)
      bookQb.andWhere('sb_site.id = :site_id', { site_id: query.site_id });

    if (query?.status?.length) {
      bookQb.andWhere('book.status IN (:...status)', { status: query.status });
    } else {
      bookQb.andWhere('book.status IN (:...status)', {
        status: ['NEW', 'DRAFT', 'PUBLISHED'],
      });
    }
    if (query?.categories_id) {
      const categoriesIds = query.categories_id
        .split(',')
        .map((id) => id.trim());
      bookQb.andWhere('categories.id IN (:...categoriesIds)', {
        categoriesIds,
      });
    }
    const data = await paginate(
      { ...query, filter: { ...query.filter } },
      bookQb,
      {
        sortableColumns: ['created_at'],
        defaultSortBy: [['created_at', 'DESC']],
        maxLimit: 500,
        defaultLimit: 20,
      },
    );

    return {
      ...data,
      data: data.data.map((book) => {
        const word_count = book.chapters.reduce((total, chapter) => {
          const wordCount = chapter.content
            ? chapter.content.trim().split(/\s+/).length
            : 0;
          return total + wordCount;
        }, 0);

        return {
          ...book,
          word_count,
        };
      }),
    };
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
        return { ...chapter, word_count: chapter?.content?.length || 0 };
      }),
    };
  }

  async crawlerBook(id: string) {
    const book = await this.bookRepository.findOne({
      where: { id: id },
      relations: ['chapters', 'thumbnail'],
    });

    // TODO FETCH CHAPTER

    // if (book.source_url && Number(book.total_chapter) > 0) {
    //   for (let index = 1; index <= book.total_chapter; index++) {
    //     const chapter = book.chapters.find(
    //       (chapter) => chapter.chapter_number == index,
    //     );
    //     if (!chapter || !chapter?.content) {
    //       const chapterUrl = book.source_url + `chuong-${index}`;
    //       const response = await fetchWithRetry(chapterUrl);
    //       if (!response.ok) break;
    //       const html = await response.text();
    //       const $ = cheerio.load(html);
    //       $('[class^="ads-"]').remove();
    //       $('[class*=" ads-"], [class^="ads-"], [class$=" ads-"]').remove();
    //       const meta_description =
    //         $('meta[name="description"]').attr('content') ||
    //         $('meta[property="og:description"]').attr('content');

    //       const keywords = $('meta[name="keywords"]')
    //         .attr('content')
    //         .split(',')
    //         .map((keyword) => ({
    //           query: keyword.trim(),
    //           slug: generateSlug(keyword.trim()),
    //         }));

    //       const chapterTitle = $('a.chapter-title').text().trim();
    //       const chapterContent = $('#chapter-c').html();

    //       await this.chapterRepository.insert({
    //         book_id: book.id,
    //         chapter_number: index,
    //         content: chapterContent,
    //         meta_description: meta_description,
    //         title: chapterTitle,
    //         slug: generateSlug(book.title + '-' + chapterTitle),
    //         keywords: keywords,
    //         source_url: chapterUrl,
    //       });

    //       //         const requestBody = `Bạn là một hệ thống xử lý nội dung thông minh.
    //       // Dưới đây là dữ liệu đầu vào gồm tiêu đề, nội dung HTML (hãy sửa nội dung - text trong các thẻ html thôi nhé, không được phép sửa các class, style, cấu trúc các thẻ html), mô tả và từ khóa, hãy chọn 1 category phù hợp từ category ở dữ liệu nhập vào.
    //       // Hãy tối ưu nội dung này để rõ ràng, hấp dẫn và chuyên nghiệp hơn, đồng thời giữ nguyên các từ khóa. Trả về một object JSON có dạng:
    //       //       {
    //       //         "title": "Tiêu đề mới đã tối ưu",
    //       //         "content": "Nội dung HTML đã được cải thiện",
    //       //         "description": "Mô tả mới đã được cải thiện",
    //       //         "keywords": "${JSON.stringify(keywords)}",
    //       //         "category": {name: 'category name', slug: 'category slug'}
    //       //       }

    //       //       Dữ liệu đầu vào:
    //       //       - Tiêu đề: "${body.title}"
    //       //       - Nội dung: "${contentHtml}"
    //       //       - Mô tả: "${description}"
    //       //       - Từ khóa: "${JSON.stringify(keywords)}"
    //       //       - List Category: ${JSON.stringify(body.categories)}
    //       //     Hãy chỉ trả về JSON, không cần bất kỳ văn bản nào khác.`;

    //       //         const geminiResponse = await callGeminiApi(requestBody);
    //     }
    //   }
    // }

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
    // TODO
    // await this.deletePostUnused(post);
  }
}
