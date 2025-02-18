import { Post, Site } from '@app/entities';
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
    'autoPost',
    'token',
    'created_at',
    'posts.id',
    'posts.slug',
    'categories.id',
    'categories.slug',
    'categories.name',
  ],
  filterableColumns: { title: [FilterOperator.EQ] },
};

export const postSitePaginateConfig: PaginateConfig<Post> = {
  sortableColumns: ['created_at', 'status'],
  defaultSortBy: [
    ['status', 'DESC'],
    ['created_at', 'DESC'],
  ],
  searchableColumns: ['title', 'content'],
  maxLimit: 50,
  defaultLimit: 23,
  filterableColumns: { title: [FilterOperator.EQ] },
};
