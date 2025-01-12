import { Post, Trending, TrendingArticle } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const postPaginateConfig: PaginateConfig<Post> = {
  relations: ['thumbnail'],
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  searchableColumns: ['title', 'content'],
  maxLimit: 50,
  defaultLimit: 23,
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
