import { Book, Category, Site, SiteBook } from '@app/entities';
import { BookStatus } from '@app/entities/book.entity';
import { generateSlug } from '@app/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Like, Not, Raw, Repository } from 'typeorm';
import { booksPaginateConfig } from './books.pagination';
@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Site) private readonly siteRepo: Repository<Site>,
    @InjectRepository(Book) private readonly bookRepo: Repository<Book>,
    @InjectRepository(SiteBook)
    private readonly siteBookRepo: Repository<SiteBook>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async getHome(site: Site) {
    const getBooksList = (limit: number) =>
      this.siteBookRepo
        .createQueryBuilder('siteBook')
        .leftJoin('siteBook.book', 'book')
        .leftJoin('siteBook.site', 'site')
        .leftJoin('book.thumbnail', 'thumbnail')
        .leftJoin('book.categories', 'categories')
        .where('site.id = :siteId', { siteId: site.id })
        .andWhere('book.status = :status', { status: 'PUBLISHED' })
        .select([
          'book.id AS id',
          'book.title AS title',
          'book.slug AS slug',
          'book.meta_description AS meta_description',
          'book.keywords AS keywords',
          'book.status AS status',
          'siteBook.created_at as created_at',
          "jsonb_build_object('url', thumbnail.url, 'slug', thumbnail.slug) AS thumbnail",
          `COALESCE(
              jsonb_agg(DISTINCT jsonb_build_object(
                'id', categories.id, 
                'name', categories.name, 
                'slug', categories.slug
              )) FILTER (WHERE categories.id IS NOT NULL), '[]'
            ) AS categories`,
        ])
        .groupBy(
          'book.id, thumbnail.id, thumbnail.url, thumbnail.slug, siteBook.created_at',
        )
        .orderBy('created_at', 'DESC')
        .limit(limit)
        .getRawMany();

    const [data, categories] = await Promise.all([
      getBooksList(20),
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
      data.slice(0, 4),
      data.slice(4, 13),
      data.slice(14, 20),
    ]);

    return {
      home: { recentBooks, featureBooks, otherBooks },
      adsense: {
        adsense_ga: site.adsense_ga,
        adsense_client: site.adsense_client,
        adsense_slots: site.adsense_slots,
      },
      categories: categories,
    };
  }

  async getAdsense(site: Site) {
    console.log(site.adsense_ga);
    return {
      adsense_ga: site.adsense_ga,
      adsense_client: site.adsense_client,
      adsense_slots: site.adsense_slots,
    };
  }

  async getBookRelates(site: Site, book_slug?: string) {
    const currentBook = await this.bookRepo.findOne({
      where: { slug: book_slug },
    });

    if (!currentBook || !currentBook.keywords) {
      return [];
    }

    const relatedQueryStrings = currentBook.keywords
      .map((q) => q.query)
      .filter(Boolean);

    if (relatedQueryStrings.length === 0) {
      return [];
    }

    const relatedBooks = await this.bookRepo.find({
      relations: ['thumbnail', 'siteBooks'],
      where: {
        slug: Not(Like(book_slug)),
        siteBooks: { site_id: site.id },
        keywords: Raw(
          (alias) =>
            `EXISTS (SELECT 1 FROM jsonb_array_elements(${alias}) elem WHERE elem->>'query' IN (:...queries))`,
          { queries: relatedQueryStrings },
        ),
      },
      select: {
        id: true,
        status: true,
        meta_description: true,
        keywords: true,
        created_at: true,
        title: true,
        slug: true,
        thumbnail: {
          id: true,
          url: true,
          storage_type: true,
          slug: true,
          filename: true,
        },
      },
      take: 3,
    });

    return relatedBooks;
  }

  async getBookRecents(site: Site, book_slug?: string) {
    const recents = await this.bookRepo
      .createQueryBuilder('book')
      .innerJoin('book.siteBooks', 'siteBooks')
      .innerJoin('book.thumbnail', 'thumbnail')
      .leftJoin('book.categories', 'categories')
      .where('siteBooks.site_id = :siteId', { siteId: site.id })
      .andWhere('book.slug != :bookSlug', { bookSlug: book_slug || '' })
      .select([
        'book.id AS id',
        'book.title AS title',
        'book.meta_description AS meta_description',
        'book.keywords AS "keywords"',
        'book.created_at AS created_at',
        'book.slug AS slug',
        'book.status AS status',
        "jsonb_build_object('url', thumbnail.url, 'slug', thumbnail.slug) AS thumbnail",
        `COALESCE(json_agg(jsonb_build_object('id', categories.id, 'name', categories.name, 'slug', categories.slug)) FILTER (WHERE categories.id IS NOT NULL), '[]') AS categories`,
      ])
      .groupBy('book.id, thumbnail.url, thumbnail.slug')
      .orderBy('created_at', 'DESC')
      .limit(4)
      .getRawMany();
    return recents;
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

  async getBooksByCategory(site: Site, slug: string, query: PaginateQuery) {
    const category = await this.categoryRepo.findOne({ where: { slug: slug } });

    const data = await paginate(
      { ...query, filter: { ...query.filter } },
      this.bookRepo,
      {
        ...booksPaginateConfig,
        where: {
          siteBooks: { site_id: site.id },
          categories: { slug: category.slug },
        },
      },
    );
    return { ...data, category: category };
  }

  async getAllBooks(site: Site, query: PaginateQuery) {
    const qb = this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.thumbnail', 'thumbnail')
      .leftJoinAndSelect('book.categories', 'categories')
      .innerJoinAndSelect('book.siteBooks', 'siteBooks')
      .where('siteBooks.site_id = :siteId', { siteId: site.id })
      .select([
        'book.id',
        'book.title',
        'book.keywords',
        'book.meta_description',
        'book.created_at',
        'book.slug',
        'book.status',
        'thumbnail.id',
        'thumbnail.url',
        'thumbnail.slug',
        'categories.id',
        'categories.slug',
        'categories.name',
      ])
      .groupBy('book.id, thumbnail.id, categories.id')
      .orderBy('book.created_at', 'DESC');

    const paginatedData = await paginate(query, qb, {
      sortableColumns: ['created_at'],
      defaultSortBy: [['created_at', 'DESC']],
      maxLimit: 50,
      defaultLimit: 23,
    });

    return { ...paginatedData };
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
        meta_description: true,
      },
      relations: ['thumbnail', 'categories', 'siteBooks'],
    });

    return { data: book };
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
          status: BookStatus.PUBLISHED,
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

  async getRelateQuery(site: Site) {
    const books = await this.bookRepo
      .createQueryBuilder('book')
      .select(['book.keywords'])
      .innerJoin('book.siteBooks', 'siteBooks')
      .where('siteBooks.site_id = :siteId', { siteId: site.id })
      .getMany();

    const allQueries = books
      .flatMap((book) => book.keywords || [])
      .map((item) => ({
        query: item.query,
        slug: generateSlug(item.query),
      }))
      .filter((item) => item.query);

    const queryCountMap = allQueries.reduce(
      (acc, { query, slug }) => {
        if (!acc[query]) {
          acc[query] = { query, slug, count: 0 };
        }
        acc[query].count += 1;
        return acc;
      },
      {} as Record<string, { query: string; slug: string; count: number }>,
    );

    const sortedQueries = Object.values(queryCountMap).sort(
      (a, b) => b.count - a.count,
    );

    return sortedQueries;
  }

  async getBookByRelatedQuery(site: Site, slug: string) {
    const book = await this.bookRepo
      .createQueryBuilder('book')
      .leftJoin('book.sites', 'site')
      .where('site.id = :siteId', { siteId: site.id })
      .andWhere(`book.keywords @> :query`, {
        query: JSON.stringify([{ slug }]),
      }) // 🔥 Kiểm tra slug trong JSONB
      .orderBy('book.created_at', 'DESC') // Lấy bài mới nhất
      .getOne();

    return book;
  }

  async getBooksByTag(site: Site, slug: string, query: PaginateQuery) {
    const qb = this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.thumbnail', 'thumbnail')
      .leftJoinAndSelect('book.categories', 'categories')
      .innerJoinAndSelect('book.siteBooks', 'siteBooks')
      .where('siteBooks.site_id = :siteId', { siteId: site.id })
      .andWhere(
        `EXISTS (
            SELECT 1 FROM jsonb_array_elements(book.keywords) AS elem
            WHERE elem->>'slug' = :slug
        )`,
        { slug },
      )
      .select([
        'book.id',
        'book.title',
        'book.keywords',
        'book.meta_description',
        'book.created_at',
        'book.slug',
        'book.status',
        'thumbnail.id',
        'thumbnail.url',
        'thumbnail.slug',
        'categories.id',
        'categories.slug',
        'categories.name',
      ])
      .groupBy('book.id, thumbnail.id, categories.id')
      .orderBy('book.created_at', 'DESC');

    const paginatedData = await paginate(query, qb, {
      sortableColumns: ['created_at'],
      defaultSortBy: [['created_at', 'DESC']],
      maxLimit: 50,
      defaultLimit: 18,
    });
    const tag = paginatedData.data[0].keywords.find(
      (query) => query.slug == slug,
    );

    return { ...paginatedData, tag: tag };
  }
}
