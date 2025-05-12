import { Book } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const bookPaginateConfig: PaginateConfig<Book> = {
  relations: ['thumbnail', 'article', 'categories'],
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  searchableColumns: ['title', 'content'],
  maxLimit: 50,
  defaultLimit: 23,
  select: [
    'article.source',
    'article.slug',

    'id',
    'title',
    'meta_description',
    'created_at',
    'thumbnail',
    'thumbnail.url',
    'thumbnail.slug',
    'categories.id',
    'categories.slug',
    'categories.name',

    'article_id',

    'slug',
    'status',
  ],
  filterableColumns: { title: [FilterOperator.EQ] },
};
