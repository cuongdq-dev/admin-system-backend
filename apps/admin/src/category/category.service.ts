import { Category, User } from '@app/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { categoryPaginateConfig } from './category.pagination';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectRepository(Category)
    private postCategoryRepository: Repository<Category>,
  ) {}

  async getAll(query: PaginateQuery) {
    return paginate(
      { ...query, filter: { ...query.filter } },
      this.postCategoryRepository,
      categoryPaginateConfig,
    );
  }

  create(createDto: Category) {
    return this.postCategoryRepository.create({ ...createDto }).save();
  }

  async update(category: Category, updateDto: Category) {
    await this.postCategoryRepository.update(
      { id: category.id },
      { ...updateDto },
    );

    return { ...category, ...updateDto };
  }

  async delete(category: Category) {
    await this.postCategoryRepository.softDelete(category.id);
  }
}
