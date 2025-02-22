import { Category, Post, Site } from '@app/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
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
    const [categories, recentNews, featureNews, otherNews] = await Promise.all([
      this.categoryRepo
        .createQueryBuilder('category')
        .innerJoin('category.sites', 'site') // Lọc theo siteId
        .leftJoinAndSelect('category.posts', 'post') // Lấy dữ liệu từ bảng `posts`
        .where('site.id = :siteId', { siteId: site.id })
        .select([
          'category.id AS id',
          'category.name AS name',
          'category.slug as slug',
          'COUNT(DISTINCT post.id) AS postCount', // Đếm số bài viết trong từng category
        ])
        .groupBy('category.id, category.name, category.slug')
        .getRawMany(),

      this.postRepo
        .createQueryBuilder('post')
        .innerJoin('post.sites', 'site')
        .innerJoin('post.thumbnail', 'thumbnail')
        .leftJoin('post.categories', 'categories')
        .where('site.id = :siteId', { siteId: site.id })
        .select([
          'post.id AS id',
          'post.title AS title',
          'post.meta_description AS meta_description',
          'post.created_at AS created_at',
          'post.slug AS slug',
          'post.status AS status',
          "jsonb_build_object('data', thumbnail.data, 'url', thumbnail.url, 'slug', thumbnail.slug) AS thumbnail",
          `COALESCE(json_agg(jsonb_build_object('id', categories.id, 'name', categories.name, 'slug', categories.slug)) FILTER (WHERE categories.id IS NOT NULL), '[]') AS categories`, // Gom nhóm categories
        ])
        .groupBy('post.id, thumbnail.data, thumbnail.url, thumbnail.slug')
        .orderBy('created_at', 'DESC')
        .limit(4)
        .getRawMany(),

      this.postRepo
        .createQueryBuilder('post')
        .innerJoin('post.sites', 'site')
        .innerJoin('post.thumbnail', 'thumbnail')
        .leftJoin('post.categories', 'categories')
        .where('site.id = :siteId', { siteId: site.id })
        .select([
          'post.id AS post_id',
          'post.title AS title',
          'post.meta_description AS meta_description',
          'post.created_at AS created_at',
          'post.slug AS slug',
          'post.status AS status',
          "jsonb_build_object('data', thumbnail.data, 'url', thumbnail.url, 'slug', thumbnail.slug) AS thumbnail",
          `COALESCE(json_agg(jsonb_build_object('id', categories.id, 'name', categories.name, 'slug', categories.slug)) FILTER (WHERE categories.id IS NOT NULL), '[]') AS categories`, // Gom nhóm categories
        ])
        .groupBy('post.id, thumbnail.data, thumbnail.url, thumbnail.slug')
        .orderBy('RANDOM()')
        .limit(9)
        .getRawMany(),

      this.postRepo
        .createQueryBuilder('post')
        .innerJoin('post.sites', 'site')
        .innerJoin('post.thumbnail', 'thumbnail')
        .leftJoin('post.categories', 'categories')
        .where('site.id = :siteId', { siteId: site.id })
        .select([
          'post.id AS post_id',
          'post.title AS title',
          'post.meta_description AS meta_description',
          'post.created_at AS created_at',
          'post.slug AS slug',
          'post.status AS status',
          "jsonb_build_object('data', thumbnail.data, 'url', thumbnail.url, 'slug', thumbnail.slug) AS thumbnail",
          `COALESCE(json_agg(jsonb_build_object('id', categories.id, 'name', categories.name, 'slug', categories.slug)) FILTER (WHERE categories.id IS NOT NULL), '[]') AS categories`, // Gom nhóm categories
        ])
        .groupBy('post.id, thumbnail.data, thumbnail.url, thumbnail.slug')
        .orderBy('RANDOM()')
        .limit(6)
        .getRawMany(),
    ]);

    return { categories, recentNews, featureNews, otherNews };
  }

  async getCategories(site: Site) {
    const siteId = site.id;
    const categories = await this.categoryRepo
      .createQueryBuilder('categories')
      .leftJoinAndSelect('categories.sites', 'site')
      .leftJoin('categories.posts', 'post')
      .leftJoin('post.sites', 'postSite')
      .where('site.id = :siteId', { siteId })
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
    });
    return data;
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
      },
      relations: ['thumbnail', 'categories', 'article'],
    });
    const categoryIds = post?.categories?.map((cat) => cat.id);

    if (categoryIds.length === 0) {
      const relatedPosts = await this.postRepo
        .createQueryBuilder('post')
        .innerJoin('post.sites', 'site')
        .innerJoin('post.thumbnail', 'thumbnail')
        .leftJoin('post.categories', 'categories')
        .where('site.id = :siteId', { siteId: site.id })
        .andWhere('post.id != :postId', { postId: post.id }) // Loại trừ bài viết gốc
        .select([
          'post.id AS post_id',
          'post.title AS title',
          'post.meta_description AS meta_description',
          'post.created_at AS created_at',
          'post.slug AS slug',
          'post.status AS status',
          "jsonb_build_object('data', thumbnail.data, 'url', thumbnail.url) AS thumbnail", // Gói thumbnail vào object
          `COALESCE(json_agg(jsonb_build_object('id', categories.id, 'name', categories.name, 'slug', categories.slug)) FILTER (WHERE categories.id IS NOT NULL), '[]') AS categories`, // Gom nhóm categories
        ])
        .groupBy('post.id, thumbnail.data, thumbnail.url')
        .orderBy('post.created_at', 'DESC')
        .limit(2)
        .getRawMany();
      return { data: post, relatedPosts: relatedPosts };
    }

    const relatedPosts = await this.postRepo
      .createQueryBuilder('post')
      .innerJoin('post.sites', 'site')
      .innerJoin('post.thumbnail', 'thumbnail')
      .leftJoin('post.categories', 'categories')
      .where('site.id = :siteId', { siteId: site.id })
      .andWhere('post.id != :postId', { postId: post.id }) // Loại trừ bài viết gốc
      .andWhere('categories.id IN (:...categoryIds)', { categoryIds }) // Chỉ lấy bài viết có chung category
      .select([
        'post.id AS id',
        'post.title AS title',
        'post.meta_description AS meta_description',
        'post.created_at AS created_at',
        'post.slug AS slug',
        'post.status AS status',
        "jsonb_build_object('data', thumbnail.data, 'url', thumbnail.url) AS thumbnail", // Gói thumbnail vào object
        `COALESCE(json_agg(jsonb_build_object('id', categories.id, 'name', categories.name, 'slug', categories.slug)) FILTER (WHERE categories.id IS NOT NULL), '[]') AS categories`, // Gom nhóm categories
      ])
      .groupBy('post.id, thumbnail.data, thumbnail.url')
      .orderBy('post.created_at', 'DESC')
      .limit(2)
      .getRawMany();

    return { data: post, relatedPosts };
  }
}
