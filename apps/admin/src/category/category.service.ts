import { Category } from '@app/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { CategoryBodyDto } from './category.dto';
import { categoryPaginateConfig } from './category.pagination';

@Injectable()
export class CategoryService {
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

  async create(createDto: CategoryBodyDto) {
    const result = await this.postCategoryRepository
      .create({ ...createDto })
      .save();
    return this.postCategoryRepository.findOne({
      where: { id: result.id },
      relations: ['posts', 'sites'],
    });
  }

  async update(category: Category, updateDto: CategoryBodyDto) {
    await this.postCategoryRepository.save({ ...category, ...updateDto });
    return this.postCategoryRepository.findOne({
      where: { id: category.id },
      relations: ['posts', 'sites'],
    });
  }
  async delete(category: Category) {
    await this.postCategoryRepository.softDelete(category.id);
  }
}
