import { Category } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const categoryPaginateConfig: PaginateConfig<Category> = {
  relations: ['sites', 'books', 'posts'],
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  maxLimit: 100,
  defaultLimit: 20,
  select: [
    'id',
    'name',
    'slug',
    'description',
    'created_at',

    'books.id',
    'books.title',
    'books.slug',

    'posts.id',
    'posts.title',
    'posts.slug',

    'sites.id',
    'sites.name',
    'sites.domain',
  ],
  filterableColumns: { title: [FilterOperator.EQ] },
};
