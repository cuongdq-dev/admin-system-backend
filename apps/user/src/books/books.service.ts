import { Book, Category, Chapter, Site, SiteBook } from '@app/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
export class BooksService {
  constructor(
    @InjectRepository(Site) private readonly siteRepo: Repository<Site>,
    @InjectRepository(Book) private readonly bookRepo: Repository<Book>,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    @InjectRepository(SiteBook)
    private readonly siteBookRepo: Repository<SiteBook>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  getBooksList = (limit: number, siteId: string) =>
    this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.thumbnail', 'thumbnail')
      .leftJoinAndSelect('book.categories', 'categories')
      .innerJoin('book.siteBooks', 'siteBook')
      .innerJoin('siteBook.site', 'site')
      .where('site.id = :siteId', { siteId })
      .select([
        'book.id',
        'book.title',
        'book.slug',
        'book.meta_description',
        'book.description',
        'book.total_chapter',
        'book.is_new',
        'book.is_hot',
        'book.is_full',
        'book.author',
        'book.keywords',
        'book.status',
        'book.created_at',
        'thumbnail.url',
        'thumbnail.id',
        'thumbnail.slug',
        'categories.slug',
        'categories.id',
        'categories.name',
      ])
      .groupBy('book.id, thumbnail.id, siteBook.id, categories.id')
      .orderBy('RANDOM()')
      .limit(limit)
      .getMany();

  async getHome(site: Site) {
    const [top, data, categories] = await Promise.all([
      this.bookRepo
        .createQueryBuilder('book')
        .leftJoinAndSelect('book.thumbnail', 'thumbnail')
        .leftJoinAndSelect('book.categories', 'categories')
        .innerJoin('book.chapters', 'chapters')
        .innerJoin('book.siteBooks', 'siteBook')
        .innerJoin('siteBook.site', 'site')
        .where('site.id = :siteId', { siteId: site.id })
        .andWhere(
          `(SELECT COUNT(*) FROM chapters chapter WHERE chapter.book_id = book.id) > 15`,
        )
        .select([
          'book.id',
          'book.title',
          'book.slug',
          'book.is_new',
          'book.is_hot',
          'book.total_chapter',
          'book.is_full',
          'book.author',
          'book.description',
          'book.status',
          'book.created_at',
          'thumbnail.url',
          'thumbnail.id',
          'thumbnail.slug',
          'categories.slug',
          'categories.id',
          'categories.name',
        ])
        .groupBy('book.id, thumbnail.id, siteBook.id, categories.id')
        .orderBy('RANDOM()')
        .getOne(),

      this.getBooksList(17, site.id),

      this.categoryRepo
        .createQueryBuilder('categories')
        .leftJoin('categories.books', 'book')
        .leftJoin('categories.sites', 'sites')
        .leftJoin('book.siteBooks', 'siteBooks')
        .where('sites.id = :siteId', { siteId: site.id })
        .andWhere('siteBooks.site_id = :siteId', { siteId: site.id })
        .select(['categories.id', 'categories.slug', 'categories.name'])
        .loadRelationCountAndMap(
          'categories.bookCount',
          'categories.books',
          'book',
          (qb) => {
            return qb
              .leftJoin('book.siteBooks', 'filteredSite')
              .where('filteredSite.site_id = :siteId', { siteId: site.id });
          },
        )
        .getMany(),
    ]);
    const [recentBooks, featureBooks, otherBooks] = await Promise.all([
      data.slice(0, 5),
      data.slice(6, 11),
      data.slice(12, 17),
    ]);

    return {
      adsense: {
        adsense_ga: site.adsense_ga,
        adsense_client: site.adsense_client,
        adsense_slots: site.adsense_slots,
      },
      categories,
      home: { top: top, recentBooks, featureBooks, otherBooks },
    };
  }

  async getAdsense(site: Site) {
    return {
      adsense_ga: site.adsense_ga,
      adsense_client: site.adsense_client,
      adsense_slots: site.adsense_slots,
    };
  }

  async getCategories(site: Site) {
    const siteId = site.id;
    const categories = await this.categoryRepo
      .createQueryBuilder('categories')
      .leftJoin('categories.books', 'book')
      .leftJoin('categories.sites', 'sites')
      .leftJoin('book.siteBooks', 'siteBooks')
      .where('sites.id = :siteId', { siteId })
      .andWhere('siteBooks.site_id = :siteId', { siteId })
      .select(['categories.id', 'categories.slug', 'categories.name'])
      .loadRelationCountAndMap(
        'categories.bookCount',
        'categories.books',
        'book',
        (qb) => {
          return qb
            .leftJoin('book.siteBooks', 'filteredSite')
            .where('filteredSite.site_id = :siteId', { siteId });
        },
      )
      .getMany();
    categories.forEach((category: any) => {
      if (!category.bookCount) category.bookCount = 0;
    });

    return categories;
  }
  async getSiteSetting(site: Site) {
    const siteId = site.id;
    const categories = await this.categoryRepo
      .createQueryBuilder('categories')
      .leftJoin('categories.books', 'book')
      .leftJoin('categories.sites', 'sites')
      .leftJoin('book.siteBooks', 'siteBooks')
      .where('sites.id = :siteId', { siteId })
      .andWhere('siteBooks.site_id = :siteId', { siteId })
      .select(['categories.id', 'categories.slug', 'categories.name'])
      .loadRelationCountAndMap(
        'categories.bookCount',
        'categories.books',
        'book',
        (qb) => {
          return qb
            .leftJoin('book.siteBooks', 'filteredSite')
            .where('filteredSite.site_id = :siteId', { siteId });
        },
      )
      .getMany();
    categories.forEach((category: any) => {
      if (!category.bookCount) category.bookCount = 0;
    });

    return {
      categories: categories,
      adsense: {
        adsense_ga: site.adsense_ga,
        adsense_client: site.adsense_client,
        adsense_slots: site.adsense_slots,
      },
    };
  }

  async getAllBooks(site: Site, query: PaginateQuery, categorySlug?: string) {
    const qb = this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.thumbnail', 'thumbnail')
      .leftJoinAndSelect('book.categories', 'categories')
      .innerJoinAndSelect('book.chapters', 'chapters')
      .loadRelationCountAndMap('book.total_chapter', 'book.chapters')
      .innerJoin('book.siteBooks', 'siteBook')
      .innerJoin('siteBook.site', 'site')
      .where('site.id = :siteId', { siteId: site.id })
      .select([
        'book.id',
        'book.created_at',
        'book.title',
        'book.slug',
        'book.meta_description',
        'book.description',
        'book.is_new',
        'book.is_hot',
        'book.is_full',
        'book.author',
        'book.keywords',
        'book.status',
        'thumbnail.url',
        'thumbnail.id',
        'thumbnail.slug',

        'categories.slug',
        'categories.id',
        'categories.name',
      ])
      .groupBy('book.id, thumbnail.id, siteBook.id, categories.id');

    if (categorySlug) {
      qb.andWhere('categories.slug = :slug', { slug: categorySlug });
    }

    if (query?.search) {
      qb.andWhere(`unaccent(LOWER(book.title)) ILIKE unaccent(:search)`, {
        search: `%${query.search}%`,
      });
    }

    const paginatedData = await paginate(query, qb, {
      sortableColumns: ['created_at', 'title'],
      defaultSortBy: [['created_at', 'DESC']],
      maxLimit: 50,
      defaultLimit: 23,
    });
    return paginatedData;
  }

  async getBookBySlug(site: Site, slug: string) {
    const book = await this.bookRepo.findOne({
      where: { siteBooks: { site_id: site.id }, slug: slug },

      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: { id: true, url: true, slug: true },
        categories: true,
        content: true,
        keywords: true,
        created_at: true,
        updated_at: true,
        description: true,
        author: { name: true, slug: true },
        meta_description: true,
        chapters: true,
        is_full: true,
        is_hot: true,
        is_new: true,
        total_chapter: true,
      },
      relations: ['thumbnail', 'categories', 'siteBooks', 'chapters'],
    });

    const recommence = await this.getBooksList(4, site.id);
    return { data: book, recommence };
  }

  async getChapterContent(site: Site, slug: string, chapterNumber: string) {
    const result = await this.chapterRepo.findOne({
      where: {
        book: { slug: slug, siteBooks: { site_id: site.id } },
        chapter_number: Number(chapterNumber),
      },
      relations: [
        'book',
        'book.thumbnail',
        'book.categories',
        'book.chapters',
        'book.siteBooks',
      ],
    });

    return {
      ...result,
      book: { ...result?.book, total_chapter: result?.book?.chapters?.length },
    };
  }

  async getSitemapBooks(domain: string) {
    if (!domain) throw new Error('Domain is required');

    const site = await this.siteRepo.findOne({
      where: { domain: `https://${domain}` },
    });
    if (!site) throw new Error(`No site found for domain ${domain}`);

    return {
      total: await this.bookRepo.count({
        where: { siteBooks: { site_id: site.id } },
      }),
      perpage: 100,
    };
  }

  async getSitemapCategories(domain: string) {
    if (!domain) throw new Error('Domain is required');

    const site = await this.siteRepo.findOne({
      where: { domain: `https://${domain}` },
    });
    if (!site) throw new Error(`No site found for domain ${domain}`);

    return await this.categoryRepo.find({
      where: { sites: { id: site.id } },
      select: ['created_at', 'slug', 'id', 'name'],
    });
  }

  async getSitemapBooksByPage(domain: string, page: number) {
    const perpage = 100;
    if (!domain) throw new Error('Domain is required');
    if (page < 1) throw new Error('Invalid page number');

    const site = await this.siteRepo.findOne({
      where: { domain: `https://${domain}` },
    });
    if (!site) throw new Error(`No site found for domain ${domain}`);

    const books = await this.bookRepo.find({
      where: { siteBooks: { site_id: site.id } },
      select: ['id', 'created_at', 'slug'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * perpage,
      take: perpage,
    });
    return books;
  }

  async getRss(site: Site) {
    const data = await this.bookRepo.find({
      where: { siteBooks: { site_id: site.id } },
      select: {
        created_at: true,
        meta_description: true,
        title: true,
        slug: true,
        id: true,
      },
      take: 50,
    });
    return data;
  }
}
