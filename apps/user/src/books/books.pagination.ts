import { Book } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const booksPaginateConfig: PaginateConfig<Book> = {
  relations: ['thumbnail', 'categories', 'siteBooks', 'siteBooks.site'],
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
    'thumbnail.url',
    'thumbnail.storage_type',
    'slug',
    'status',
    'categories.name',
    'categories.slug',
    'categories.id',
    'siteBooks.site.id AS site_id',
    'siteBooks.site.adsense_client',
    'siteBooks.site.adsense_slots',
    'siteBooks.id',
  ],
  filterableColumns: { title: [FilterOperator.EQ] },
};
