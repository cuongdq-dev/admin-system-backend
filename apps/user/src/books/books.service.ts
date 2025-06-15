import { Book, Category, Chapter, Site, SiteBook } from '@app/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { MoreThan, Repository } from 'typeorm';

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

  // Helper: select common book fields
  private getBookSelectFields() {
    return [
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
    ];
  }

  // Helper: get categories by site
  private async getCategoriesBySite(siteId: string) {
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
        (qb) =>
          qb
            .leftJoin('book.siteBooks', 'filteredSite')
            .where('filteredSite.site_id = :siteId', { siteId }),
      )
      .getMany();

    categories.forEach((category: any) => {
      if (!category.bookCount) category.bookCount = 0;
    });

    return categories;
  }

  async getHome(site: Site) {
    const siteId = site.id;

    const [books, categories] = await Promise.all([
      this.bookRepo
        .createQueryBuilder('book')
        .leftJoinAndSelect('book.thumbnail', 'thumbnail')
        .leftJoinAndSelect('book.categories', 'categories')
        .innerJoin('book.siteBooks', 'siteBook')
        .innerJoin('siteBook.site', 'site')
        .where('site.id = :siteId', { siteId })
        .select(this.getBookSelectFields())
        .groupBy('book.id, thumbnail.id, siteBook.id, categories.id')
        .andWhere('book.total_chapter > 20')
        .getMany(),
      this.getCategoriesBySite(siteId),
    ]);

    const shuffledBooks = books.sort(() => 0.5 - Math.random());

    const top = shuffledBooks[0];
    const recentBooks = shuffledBooks.slice(1, 7);
    const featureBooks = shuffledBooks.slice(7, 13);
    const otherBooks = shuffledBooks.slice(13, 19);

    return {
      adsense: {
        adsense_ga: site.adsense_ga,
        adsense_client: site.adsense_client,
        adsense_slots: site.adsense_slots,
      },
      categories,
      home: { top, recentBooks, featureBooks, otherBooks },
    };
  }

  getAdsense(site: Site) {
    return {
      adsense_ga: site.adsense_ga,
      adsense_client: site.adsense_client,
      adsense_slots: site.adsense_slots,
    };
  }

  async getCategories(site: Site) {
    return this.getCategoriesBySite(site.id);
  }

  async getSiteSetting(site: Site) {
    return {
      categories: await this.getCategoriesBySite(site.id),
      adsense: this.getAdsense(site),
    };
  }

  async getAllBooks(site: Site, query: PaginateQuery, categorySlug?: string) {
    const qb = this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.thumbnail', 'thumbnail')
      .leftJoinAndSelect('book.categories', 'categories')
      .innerJoin('book.chapters', 'chapters')
      .loadRelationCountAndMap('book.total_chapter', 'book.chapters')
      .innerJoin('book.siteBooks', 'siteBook')
      .innerJoin('siteBook.site', 'site')
      .where('site.id = :siteId', { siteId: site.id })
      .andWhere('book.total_chapter > 0')
      .select(this.getBookSelectFields())
      .groupBy('book.id, thumbnail.id, siteBook.id, categories.id');

    if (categorySlug) {
      qb.andWhere('categories.slug = :slug', { slug: categorySlug });
    }

    if (query?.search) {
      qb.andWhere(`unaccent(LOWER(book.title)) ILIKE unaccent(:search)`, {
        search: `%${query.search}%`,
      });
    }

    return paginate(query, qb, {
      sortableColumns: ['created_at', 'title'],
      defaultSortBy: [['created_at', 'DESC']],
      maxLimit: 50,
      defaultLimit: 20,
    });
  }

  async getBookBySlug(site: Site, slug: string) {
    const qb = this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.thumbnail', 'thumbnail')
      .leftJoinAndSelect('book.categories', 'categories')
      .leftJoinAndSelect('book.chapters', 'chapters')
      .leftJoinAndSelect('book.siteBooks', 'siteBooks')
      .where('book.slug = :slug', { slug })
      .andWhere('siteBooks.site_id = :siteId', { siteId: site.id });

    const book = await qb.getOne();

    const recommence = await this.bookRepo.find({
      where: { siteBooks: { site_id: site.id }, total_chapter: MoreThan(5) },
      relations: ['thumbnail', 'categories'],
      take: 5,
    });

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
      book: {
        ...result?.book,
        total_chapter: result?.book?.chapters?.length ?? 0,
      },
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
        where: {
          siteBooks: { site_id: site.id },
          total_chapter: MoreThan(1),
        },
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
      where: {
        siteBooks: { site_id: site.id },
        total_chapter: MoreThan(1),
      },
      select: ['id', 'created_at', 'slug'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * perpage,
      take: perpage,
    });
    return books;
  }

  async getRss(site: Site) {
    const data = await this.bookRepo.find({
      where: {
        siteBooks: { site_id: site.id },
        total_chapter: MoreThan(1),
      },
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
