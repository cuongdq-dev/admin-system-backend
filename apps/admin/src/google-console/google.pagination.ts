import { Site, SitePost } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const googleIndexingPaginateConfig: PaginateConfig<SitePost> = {
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
  defaultLimit: 50,
  filterableColumns: {
    title: [FilterOperator.EQ],
    indexStatus: [FilterOperator.IN],
  },
};
