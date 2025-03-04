import { Category, Post, Site } from '@app/entities';
import { PostStatus } from '@app/entities/post.entity';
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
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async getHome(site: Site) {
    const [recentNews, featureNews, otherNews] = await Promise.all([
      this.postRepo
        .createQueryBuilder('post')
        .innerJoin('post.sites', 'site')
        .leftJoin('post.thumbnail', 'thumbnail')
        .leftJoin('post.categories', 'categories')
        .where('site.id = :siteId', { siteId: site.id })
        .andWhere('post.status = :status', { status: 'PUBLISHED' }) // Lọc PUBLISHED
        .select([
          'post.id AS id',
          'post.title AS title',
          'post.meta_description AS meta_description',
          'post.created_at AS created_at',
          'post.slug AS slug',
          'post.status AS status',
          "jsonb_build_object('id', thumbnail.id, 'data', thumbnail.data, 'url', thumbnail.url, 'slug', thumbnail.slug) AS thumbnail",
          `COALESCE(
          jsonb_agg(jsonb_build_object('id', categories.id, 'name', categories.name, 'slug', categories.slug)) 
          FILTER (WHERE categories.id IS NOT NULL), '[]'
        ) AS categories`,
        ])
        .groupBy(
          'post.id, thumbnail.id, thumbnail.data, thumbnail.url, thumbnail.slug',
        )
        .orderBy('post.created_at', 'DESC')
        .limit(4)
        .getRawMany(),

      this.postRepo
        .createQueryBuilder('post')
        .innerJoin('post.sites', 'site')
        .leftJoin('post.thumbnail', 'thumbnail')
        .leftJoin('post.categories', 'categories')
        .where('site.id = :siteId', { siteId: site.id })
        .andWhere('post.status = :status', { status: 'PUBLISHED' }) // Lọc PUBLISHED
        .select([
          'post.id AS post_id',
          'post.title AS title',
          'post.meta_description AS meta_description',
          'post.created_at AS created_at',
          'post.slug AS slug',
          'post.status AS status',
          "jsonb_build_object('id', thumbnail.id, 'data', thumbnail.data, 'url', thumbnail.url, 'slug', thumbnail.slug) AS thumbnail",
          `COALESCE(
          jsonb_agg(jsonb_build_object('id', categories.id, 'name', categories.name, 'slug', categories.slug)) 
          FILTER (WHERE categories.id IS NOT NULL), '[]'
        ) AS categories`,
        ])
        .groupBy(
          'post.id, thumbnail.id, thumbnail.data, thumbnail.url, thumbnail.slug',
        )
        .orderBy('post.created_at', 'DESC')
        .limit(9)
        .getRawMany(),

      this.postRepo
        .createQueryBuilder('post')
        .innerJoin('post.sites', 'site')
        .leftJoin('post.thumbnail', 'thumbnail')
        .leftJoin('post.categories', 'categories')
        .where('site.id = :siteId', { siteId: site.id })
        .andWhere('post.status = :status', { status: 'PUBLISHED' }) // Lọc PUBLISHED
        .select([
          'post.id AS post_id',
          'post.title AS title',
          'post.meta_description AS meta_description',
          'post.created_at AS created_at',
          'post.slug AS slug',
          'post.status AS status',
          "jsonb_build_object('id', thumbnail.id, 'data', thumbnail.data, 'url', thumbnail.url, 'slug', thumbnail.slug) AS thumbnail",
          `COALESCE(
          jsonb_agg(jsonb_build_object('id', categories.id, 'name', categories.name, 'slug', categories.slug)) 
          FILTER (WHERE categories.id IS NOT NULL), '[]'
        ) AS categories`,
        ])
        .groupBy(
          'post.id, thumbnail.id, thumbnail.data, thumbnail.url, thumbnail.slug',
        )
        .orderBy('post.created_at', 'DESC')
        .limit(6)
        .getRawMany(),
    ]);

    return { recentNews, featureNews, otherNews };
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
      relations: ['thumbnail', 'sites'],
      where: {
        slug: Not(Like(post_slug)),
        sites: { id: site.id },
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
        created_at: true,
        title: true,
        slug: true,
        sites: { adsense_client: true, adsense_slots: true, id: true },
        thumbnail: {
          id: true,
          data: true,
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
      .innerJoin('post.sites', 'site')
      .innerJoin('post.thumbnail', 'thumbnail')
      .leftJoin('post.categories', 'categories')
      .where('site.id = :siteId', { siteId: site.id })
      .andWhere('post.slug != :postSlug', { postSlug: post_slug || '' })
      .select([
        'post.id AS id',
        'post.title AS title',
        'post.meta_description AS meta_description',
        'post.created_at AS created_at',
        'post.slug AS slug',
        'post.status AS status',
        "jsonb_build_object('data', thumbnail.data, 'url', thumbnail.url, 'slug', thumbnail.slug) AS thumbnail",
        `COALESCE(json_agg(jsonb_build_object('id', categories.id, 'name', categories.name, 'slug', categories.slug)) FILTER (WHERE categories.id IS NOT NULL), '[]') AS categories`,
        `COALESCE(json_agg(DISTINCT jsonb_build_object('id', site.id, 'adsense_client', site.adsense_client, 'adsense_slots', site.adsense_slots)) FILTER (WHERE site.id IS NOT NULL), '[]') AS sites`,
      ])
      .groupBy('post.id, thumbnail.data, thumbnail.url, thumbnail.slug')
      .orderBy('created_at', 'DESC')
      .limit(4)
      .getRawMany();
    return recents;
  }

  async getCategories(site: Site) {
    const siteId = site.id;
    const categories = await this.categoryRepo
      .createQueryBuilder('categories')
      .leftJoinAndSelect('categories.sites', 'site')
      .leftJoin('categories.posts', 'post')
      .leftJoin('post.sites', 'postSite')
      .where('site.id = :siteId', { siteId })
      .select(['categories.id', 'categories.slug', 'categories.name'])
      .loadRelationCountAndMap(
        'categories.postCount',
        'categories.posts',
        'post',
        (qb) => {
          return qb
            .leftJoin('post.sites', 'filteredSite')
            .where('filteredSite.id = :siteId', { siteId });
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
        where: { sites: { id: site.id }, categories: { slug: category.slug } },
      },
    );
    return { ...data, category: category };
  }

  async getAllNews(site: Site, query: PaginateQuery) {
    const data = await paginate(
      { ...query, filter: { ...query.filter } },
      this.postRepo,
      { ...newsPaginateConfig, where: { sites: { id: site.id } } },
    );
    return data;
  }

  async getNewsBySlug(site: Site, slug: string) {
    const post = await this.postRepo.findOne({
      where: { sites: { id: site.id }, slug: slug },

      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: { id: true, data: true, url: true, slug: true },
        categories: true,
        content: true,
        relatedQueries: true,
        created_at: true,
        updated_at: true,
        meta_description: true,
        article: { source: true, url: true },
        sites: { adsense_client: true, adsense_slots: true },
      },
      relations: ['thumbnail', 'categories', 'article', 'sites'],
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
        where: { sites: { id: site.id }, status: PostStatus.PUBLISHED },
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
      where: { sites: { id: site.id } },
      select: ['id', 'created_at', 'slug'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * perpage,
      take: perpage,
    });
    return posts;
  }

  async getRss(site: Site) {
    const data = await this.postRepo.find({
      where: { sites: { id: site.id } },
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
