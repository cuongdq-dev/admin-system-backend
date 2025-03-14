import { Category, Post, Site } from '@app/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class DropdownService {
  private readonly logger = new Logger(DropdownService.name);

  constructor(
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,

    @InjectRepository(Post)
    private postRepository: Repository<Post>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async getSites() {
    return await this.siteRepository
      .createQueryBuilder('site')
      .select(['site.id AS id', 'site.domain AS title'])
      .getRawMany();
  }

  async getPosts() {
    return await this.postRepository
      .createQueryBuilder('post')
      .select(['post.id AS id', 'post.title AS title'])
      .getRawMany();
  }

  async getCategories() {
    return await this.categoryRepository
      .createQueryBuilder('category')
      .select(['category.id AS id', 'category.name AS title'])
      .getRawMany();
  }

  async getCategoriesBySite(siteId: string) {
    const categories = await this.categoryRepository
      .createQueryBuilder('categories')
      .leftJoinAndSelect('categories.sites', 'site')
      .where('site.id = :siteId', { siteId })
      .select(['categories.id AS id', 'categories.name AS title'])
      .getRawMany();
    return categories;
  }
}
