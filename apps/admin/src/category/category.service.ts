import { PostCategory, User } from '@app/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { categoryPaginateConfig } from './category.pagination';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectRepository(PostCategory)
    private postCategoryRepository: Repository<PostCategory>,
  ) {}

  async getAll(query: PaginateQuery) {
    return paginate(
      { ...query, filter: { ...query.filter } },
      this.postCategoryRepository,
      categoryPaginateConfig,
    );
  }

  create(createDto: PostCategory) {
    return this.postCategoryRepository.create({ ...createDto }).save();
  }

  async update(category: PostCategory, updateDto: PostCategory) {
    await this.postCategoryRepository.update(
      { id: category.id },
      { ...updateDto },
    );

    return { ...category, ...updateDto };
  }

  async delete(category: PostCategory) {
    await this.postCategoryRepository.delete(category.id);
  }
}
