import { Category, Post } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const newsPaginateConfig: PaginateConfig<Post> = {
  relations: ['thumbnail', 'categories'],
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  searchableColumns: ['title', 'content'],
  maxLimit: 50,
  defaultLimit: 12,
  select: [
    'id',
    'title',
    'meta_description',
    'created_at',
    'thumbnail',
    'thumbnail.data',
    'thumbnail.url',
    'thumbnail.storage_type',
    'slug',
    'status',
    'categories.name',
    'categories.slug',
    'categories.id',
    'sites.adsense_client',
    'sites.adsense_slots',
  ],
  filterableColumns: { title: [FilterOperator.EQ] },
};
