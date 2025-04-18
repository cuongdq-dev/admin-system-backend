import { Category, User } from '@app/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { DataSource, Repository } from 'typeorm';
import { CategoryBodyDto } from './category.dto';
import { categoryPaginateConfig } from './category.pagination';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private postCategoryRepository: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  async getAll(query: PaginateQuery, user: User) {
    return paginate(
      { ...query, filter: { ...query.filter } },
      this.postCategoryRepository,
      {
        ...categoryPaginateConfig,
        where: { ...categoryPaginateConfig.where, created_by: user?.id },
      },
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
  async delete(category: Category, user) {
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from('site_categories')
        .where('category_id = :categoryId', { categoryId: category.id })
        .execute();

      await manager
        .createQueryBuilder()
        .delete()
        .from('category_posts')
        .where('category_id = :categoryId', { categoryId: category.id })
        .execute();

      await this.postCategoryRepository.update(
        { id: category.id },
        { deleted_by: user.id },
      );
      await this.postCategoryRepository.softDelete(category.id);
    });
    return {
      message: 'Category deleted successfully.',
      category,
    };
  }
}
