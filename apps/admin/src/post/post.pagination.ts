import { Post, Trending } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const postPaginateConfig: PaginateConfig<Post> = {
  relations: ['thumbnail', 'article'],
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  searchableColumns: ['title', 'content'],
  maxLimit: 50,
  defaultLimit: 23,
  select: [
    'article.source',
    'id',
    'title',
    'meta_description',
    'created_at',
    'thumbnail',
    'thumbnail.data',
    'slug',
  ],
  filterableColumns: { title: [FilterOperator.EQ] },
};

export const trendingPaginateConfig: PaginateConfig<Trending> = {
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  relations: ['articles', 'thumbnail', 'articles.thumbnail'],
  maxLimit: 10000,
  defaultLimit: 100000,
  filterableColumns: {
    titleQuery: [FilterOperator.EQ],
    created_at: [FilterOperator.GTE],
  },
};
