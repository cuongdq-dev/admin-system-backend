import { Site } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const sitePaginateConfig: PaginateConfig<Site> = {
  relations: ['categories', 'posts'],
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  maxLimit: 50,
  defaultLimit: 23,
  select: [
    'id',
    'name',
    'description',
    'domain',
    'token',
    'created_at',
    'categories.id',
    'categories.slug',
    'categories.name',
    'posts.id',
    'posts.title',
    'posts.slug',
  ],
  filterableColumns: { title: [FilterOperator.EQ] },
};
