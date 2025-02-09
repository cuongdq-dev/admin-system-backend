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
  ) {}

  async getHome(site: Site, query: PaginateQuery) {
    const categoryPostCounts = await this.siteRepo
      .createQueryBuilder('site')
      .innerJoin('site.categories', 'category')
      .innerJoin('category.posts', 'post')
      .where('site.id = :siteId', { siteId: site.id })
      .select('category.slug', 'categorySlug')
      .addSelect('category.name', 'categoryName')
      .addSelect('COUNT(DISTINCT post.id)', 'postCount')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .getRawMany();

    return categoryPostCounts;
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
    return await this.postRepo.findOne({
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
  }
}
