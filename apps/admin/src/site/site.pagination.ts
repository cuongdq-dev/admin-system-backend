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
    'type',
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

export const sitePostsPaginateConfig: PaginateConfig<SitePost> = {
  sortableColumns: ['created_at'],

  defaultSortBy: [['created_at', 'DESC']],
  relations: ['post', 'site'],
  select: [
    'post.slug',
    'post.title',
    'post.id',
    'site.id',
    'site.name',
    'site.domain',
    'indexStatus',
    'id',
    'updated_at',
    'created_at',
  ],
  maxLimit: 500,
  defaultLimit: 10,
  filterableColumns: {
    title: [FilterOperator.EQ],
    indexStatus: [FilterOperator.IN],
  },
};
