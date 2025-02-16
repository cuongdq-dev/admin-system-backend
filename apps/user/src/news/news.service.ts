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
    const [categories, recentPost, featurePost] = await Promise.all([
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
          "jsonb_build_object('data', thumbnail.data, 'url', thumbnail.url) AS thumbnail",
          `COALESCE(json_agg(jsonb_build_object('id', categories.id, 'name', categories.name, 'slug', categories.slug)) FILTER (WHERE categories.id IS NOT NULL), '[]') AS categories`, // Gom nhóm categories
        ])
        .groupBy('post.id, thumbnail.data, thumbnail.url')
        .orderBy('created_at', 'DESC')
        .limit(5)
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
          "jsonb_build_object('data', thumbnail.data, 'url', thumbnail.url) AS thumbnail", // Gói thumbnail vào object
          `COALESCE(json_agg(jsonb_build_object('id', categories.id, 'name', categories.name, 'slug', categories.slug)) FILTER (WHERE categories.id IS NOT NULL), '[]') AS categories`, // Gom nhóm categories
        ])
        .groupBy('post.id, thumbnail.data, thumbnail.url')
        .orderBy('RANDOM()')
        .limit(5)
        .getRawMany(),
    ]);

    return { categories, recentPost, featurePost };
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
