import { Site, SitePost } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const sitePaginateConfig: PaginateConfig<Site> = {
  relations: ['categories', 'sitePosts', 'sitePosts.post'],
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
    'sitePosts.post.id',
    'sitePosts.post.slug',
    'sitePosts.post.title',
    'categories.id',
    'categories.slug',
    'categories.name',
  ],
  filterableColumns: { title: [FilterOperator.EQ] },
};

export const postSitePaginateConfig: PaginateConfig<SitePost> = {
  sortableColumns: ['created_at', 'post.status'],
  defaultSortBy: [
    ['post.status', 'DESC'],
    ['created_at', 'DESC'],
  ],
  searchableColumns: ['post.title', 'post.content'],
  maxLimit: 50,
  defaultLimit: 23,
  filterableColumns: { title: [FilterOperator.EQ] },
};
