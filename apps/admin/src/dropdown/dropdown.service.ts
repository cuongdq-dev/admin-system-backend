import { Category, Post, Site, User } from '@app/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class DropdownService {
  constructor(
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,

    @InjectRepository(Post)
    private postRepository: Repository<Post>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async getDropdowns(user: User) {
    const [sites, posts, categories] = await Promise.all([
      this.siteRepository
        .createQueryBuilder('site')
        .where('site.created_by = :createdBy', { createdBy: user.id })
        .select(['site.id AS id', 'site.name AS title'])
        .getRawMany(),
      this.postRepository
        .createQueryBuilder('post')
        .select(['post.id AS id', 'post.title AS title'])
        .getRawMany(),
      this.categoryRepository
        .createQueryBuilder('category')
        .where('category.created_by = :createdBy', { createdBy: user.id })
        .select(['category.id AS id', 'category.name AS title'])
        .getRawMany(),
    ]);
    return { sites, posts, categories };
  }
  async getSites(user: User) {
    return await this.siteRepository
      .createQueryBuilder('site')
      .where('site.created_by = :createdBy', { createdBy: user.id })
      .select(['site.id AS id', 'site.name AS title'])
      .getRawMany();
  }

  async getPosts(user: User) {
    return await this.postRepository
      .createQueryBuilder('post')
      .select(['post.id AS id', 'post.title AS title'])
      .getRawMany();
  }

  async getCategories(user: User) {
    return await this.categoryRepository
      .createQueryBuilder('category')
      .select(['category.id AS id', 'category.name AS title'])
      .getRawMany();
  }

  async getCategoriesBySite(siteId: string, user: User) {
    const categories = await this.categoryRepository
      .createQueryBuilder('categories')
      .where('categories.created_by = :createdBy', { createdBy: user.id })
      .leftJoinAndSelect('categories.sites', 'site')
      .where('site.id = :siteId', { siteId })
      .select(['categories.id AS id', 'categories.name AS title'])
      .getRawMany();
    return categories;
  }
}
