import { SitePost } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const googleIndexingPaginateConfig: PaginateConfig<SitePost> = {
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  relations: ['post', 'site', 'post.thumbnail', 'post.categories'],
  select: [
    'post.slug',
    'post.title',
    'post.id',
    'post.meta_description',
    'post.thumbnail.id',
    'post.thumbnail.slug',
    'post.thumbnail.data',
    'post.thumbnail.url',

    'post.categories.id',
    'post.categories.slug',
    'post.categories.name',

    'site.id',
    'site.name',
    'site.domain',
    'indexStatus',
    'id',
    'updated_at',
    'created_at',
  ],
  maxLimit: 500,
  defaultLimit: 50,
  filterableColumns: {
    title: [FilterOperator.EQ],
    indexStatus: [FilterOperator.IN],
  },
};
