import { Category, Post, Site, SitePost } from '@app/entities';
import { PostStatus } from '@app/entities/post.entity';
import { generateSlug } from '@app/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Like, Not, Raw, Repository } from 'typeorm';
import { newsPaginateConfig } from './news.pagination';
@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(Site) private readonly siteRepo: Repository<Site>,
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
    @InjectRepository(SitePost)
    private readonly sitePostRepo: Repository<SitePost>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async getHome(site: Site) {
    const getNewsList = (limit: number) =>
      this.sitePostRepo
        .createQueryBuilder('sitePost')
        .leftJoin('sitePost.post', 'post')
        .leftJoin('sitePost.site', 'site')
        .leftJoin('post.thumbnail', 'thumbnail')
        .leftJoin('post.categories', 'categories')
        .where('site.id = :siteId', { siteId: site.id })
        .andWhere('post.status = :status', { status: 'PUBLISHED' })
        .select([
          'post.id AS id',
          'post.title AS title',
          'post.slug AS slug',
          'post.meta_description AS meta_description',
          'post.relatedQueries AS relatedQueries',
          'post.status AS status',
          'sitePost.created_at as created_at',
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
          'post.id, thumbnail.id, thumbnail.url, thumbnail.slug, sitePost.created_at',
        )
        .orderBy('created_at', 'DESC')
        .limit(limit)
        .getRawMany();

    const [data, categories] = await Promise.all([
      getNewsList(20),
      this.categoryRepo
        .createQueryBuilder('categories')
        .leftJoin('categories.posts', 'post')
        .leftJoin('categories.sites', 'sites')
        .leftJoin('post.sitePosts', 'sitePosts')
        .where('sites.id = :siteId', { siteId: site.id })
        .andWhere('sitePosts.site_id = :siteId', { siteId: site.id })
        .select(['categories.id', 'categories.slug', 'categories.name'])
        .loadRelationCountAndMap(
          'categories.postCount',
          'categories.posts',
          'post',
          (qb) => {
            return qb
              .leftJoin('post.sitePosts', 'filteredSite')
              .where('filteredSite.site_id = :siteId', { siteId: site.id });
          },
        )
        .getMany(),
    ]);

    const [recentNews, featureNews, otherNews] = await Promise.all([
      data.slice(0, 4),
      data.slice(4, 13),
      data.slice(14, 20),
    ]);

    return {
      home: { recentNews, featureNews, otherNews },
      adsense: {
        adsense_client: site.adsense_client,
        adsense_slots: site.adsense_slots,
      },
      categories: categories,
    };
  }

  async getAdsense(site: Site) {
    return {
      adsense_client: site.adsense_client,
      adsense_slots: site.adsense_slots,
    };
  }

  async getPostRelates(site: Site, post_slug?: string) {
    const currentPost = await this.postRepo.findOne({
      where: { slug: post_slug },
    });

    if (!currentPost || !currentPost.relatedQueries) {
      return [];
    }

    const relatedQueryStrings = currentPost.relatedQueries
      .map((q) => q.query)
      .filter(Boolean);

    if (relatedQueryStrings.length === 0) {
      return [];
    }

    const relatedPosts = await this.postRepo.find({
      relations: ['thumbnail', 'sitePosts'],
      where: {
        slug: Not(Like(post_slug)),
        sitePosts: { site_id: site.id },
        relatedQueries: Raw(
          (alias) =>
            `EXISTS (SELECT 1 FROM jsonb_array_elements(${alias}) elem WHERE elem->>'query' IN (:...queries))`,
          { queries: relatedQueryStrings },
        ),
      },
      select: {
        id: true,
        status: true,
        meta_description: true,
        relatedQueries: true,
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

    return relatedPosts;
  }

  async getPostRecents(site: Site, post_slug?: string) {
    const recents = await this.postRepo
      .createQueryBuilder('post')
      .innerJoin('post.sitePosts', 'sitePosts')
      .innerJoin('post.thumbnail', 'thumbnail')
      .leftJoin('post.categories', 'categories')
      .where('sitePosts.site_id = :siteId', { siteId: site.id })
      .andWhere('post.slug != :postSlug', { postSlug: post_slug || '' })
      .select([
        'post.id AS id',
        'post.title AS title',
        'post.meta_description AS meta_description',
        'post.relatedQueries AS "relatedQueries"',
        'post.created_at AS created_at',
        'post.slug AS slug',
        'post.status AS status',
        "jsonb_build_object('url', thumbnail.url, 'slug', thumbnail.slug) AS thumbnail",
        `COALESCE(json_agg(jsonb_build_object('id', categories.id, 'name', categories.name, 'slug', categories.slug)) FILTER (WHERE categories.id IS NOT NULL), '[]') AS categories`,
      ])
      .groupBy('post.id, thumbnail.url, thumbnail.slug')
      .orderBy('created_at', 'DESC')
      .limit(4)
      .getRawMany();
    return recents;
  }

  async getCategories(site: Site) {
    const siteId = site.id;
    const categories = await this.categoryRepo
      .createQueryBuilder('categories')
      .leftJoin('categories.posts', 'post')
      .leftJoin('categories.sites', 'sites')
      .leftJoin('post.sitePosts', 'sitePosts')
      .where('sites.id = :siteId', { siteId })
      .andWhere('sitePosts.site_id = :siteId', { siteId })
      .select(['categories.id', 'categories.slug', 'categories.name'])
      .loadRelationCountAndMap(
        'categories.postCount',
        'categories.posts',
        'post',
        (qb) => {
          return qb
            .leftJoin('post.sitePosts', 'filteredSite')
            .where('filteredSite.site_id = :siteId', { siteId });
        },
      )
      .getMany();
    categories.forEach((category: any) => {
      if (!category.postCount) category.postCount = 0;
    });

    return categories;
  }

  async getPostsByCategory(site: Site, slug: string, query: PaginateQuery) {
    const category = await this.categoryRepo.findOne({ where: { slug: slug } });

    const data = await paginate(
      { ...query, filter: { ...query.filter } },
      this.postRepo,
      {
        ...newsPaginateConfig,
        where: {
          sitePosts: { site_id: site.id },
          categories: { slug: category.slug },
        },
      },
    );
    return { ...data, category: category };
  }

  async getAllNews(site: Site, query: PaginateQuery) {
    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.thumbnail', 'thumbnail')
      .leftJoinAndSelect('post.categories', 'categories')
      .innerJoinAndSelect('post.sitePosts', 'sitePosts')
      .where('sitePosts.site_id = :siteId', { siteId: site.id })
      .select([
        'post.id',
        'post.title',
        'post.relatedQueries',
        'post.meta_description',
        'post.created_at',
        'post.slug',
        'post.status',
        'thumbnail.id',
        'thumbnail.url',
        'thumbnail.slug',
      ])
      .groupBy('post.id, thumbnail.id')
      .orderBy('post.created_at', 'DESC');

    const paginatedData = await paginate(query, qb, {
      sortableColumns: ['created_at'],
      defaultSortBy: [['created_at', 'DESC']],
      maxLimit: 50,
      defaultLimit: 23,
    });

    return { ...paginatedData };
  }

  async getNewsBySlug(site: Site, slug: string) {
    const post = await this.postRepo.findOne({
      where: { sitePosts: { site_id: site.id }, slug: slug },

      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: { id: true, url: true, slug: true },
        categories: true,
        content: true,
        relatedQueries: true,
        created_at: true,
        updated_at: true,
        meta_description: true,
        article: { source: true, url: true },
      },
      relations: ['thumbnail', 'categories', 'article', 'sitePosts'],
    });

    return { data: post };
  }

  async getSitemapPosts(domain: string) {
    if (!domain) throw new Error('Domain is required');

    const site = await this.siteRepo.findOne({
      where: { domain: `https://${domain}` },
    });
    if (!site) throw new Error(`No site found for domain ${domain}`);

    return {
      total: await this.postRepo.count({
        where: {
          sitePosts: { site_id: site.id },
          status: PostStatus.PUBLISHED,
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

  async getSitemapPostsByPage(domain: string, page: number) {
    const perpage = 100;
    if (!domain) throw new Error('Domain is required');
    if (page < 1) throw new Error('Invalid page number');

    const site = await this.siteRepo.findOne({
      where: { domain: `https://${domain}` },
    });
    if (!site) throw new Error(`No site found for domain ${domain}`);

    const posts = await this.postRepo.find({
      where: { sitePosts: { site_id: site.id } },
      select: ['id', 'created_at', 'slug'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * perpage,
      take: perpage,
    });
    return posts;
  }

  async getRss(site: Site) {
    const data = await this.postRepo.find({
      where: { sitePosts: { site_id: site.id } },
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
    const posts = await this.postRepo
      .createQueryBuilder('post')
      .select(['post.relatedQueries'])
      .innerJoin('post.sitePosts', 'sitePosts')
      .where('sitePosts.site_id = :siteId', { siteId: site.id })
      .getMany();

    const allQueries = posts
      .flatMap((post) => post.relatedQueries || [])
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

  async getPostByRelatedQuery(site: Site, slug: string) {
    const post = await this.postRepo
      .createQueryBuilder('post')
      .leftJoin('post.sites', 'site')
      .where('site.id = :siteId', { siteId: site.id })
      .andWhere(`post.relatedQueries @> :query`, {
        query: JSON.stringify([{ slug }]),
      }) // 🔥 Kiểm tra slug trong JSONB
      .orderBy('post.created_at', 'DESC') // Lấy bài mới nhất
      .getOne();

    return post;
  }

  async getPostsByTag(site: Site, slug: string, query: PaginateQuery) {
    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.thumbnail', 'thumbnail')
      .leftJoinAndSelect('post.categories', 'categories')
      .innerJoinAndSelect('post.sitePosts', 'sitePosts')
      .where('sitePosts.site_id = :siteId', { siteId: site.id })
      .andWhere(
        `EXISTS (
            SELECT 1 FROM jsonb_array_elements(post.relatedQueries) AS elem
            WHERE elem->>'slug' = :slug
        )`,
        { slug },
      )
      .select([
        'post.id',
        'post.title',
        'post.relatedQueries',
        'post.meta_description',
        'post.created_at',
        'post.slug',
        'post.status',
        'thumbnail.id',
        'thumbnail.url',
        'thumbnail.slug',
      ])
      .groupBy('post.id, thumbnail.id')
      .orderBy('post.created_at', 'DESC');

    const paginatedData = await paginate(query, qb, {
      sortableColumns: ['created_at'],
      defaultSortBy: [['created_at', 'DESC']],
      maxLimit: 50,
      defaultLimit: 18,
    });
    const tag = paginatedData.data[0].relatedQueries.find(
      (query) => query.slug == slug,
    );

    return { ...paginatedData, tag: tag };
  }
}
