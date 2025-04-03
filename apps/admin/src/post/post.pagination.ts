import { Post, SitePost, Trending } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const postPaginateConfig: PaginateConfig<Post> = {
  relations: ['thumbnail', 'article', 'categories'],
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
    // 'thumbnail.data',
    'thumbnail.url',
    'thumbnail.slug',
    'categories.id',
    'categories.slug',
    'categories.name',
    'slug',
    'status',
  ],
  filterableColumns: { title: [FilterOperator.EQ] },
};

export const postArchivedPaginateConfig: PaginateConfig<SitePost> = {
  relations: [],
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  searchableColumns: ['post.title', 'site.name'],
  maxLimit: 500,
  defaultLimit: 20,

  filterableColumns: { created_at: [FilterOperator.EQ] },
};

export const trendingPaginateConfig: PaginateConfig<Trending> = {
  relations: ['articles', 'thumbnail', 'articles.thumbnail'],
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  searchableColumns: ['titleQuery', 'trendDate'],
  maxLimit: 100,
  defaultLimit: 100,
  select: [
    'articles.title',
    'articles.relatedQueries',
    'articles.thumbnail.data',
    'articles.thumbnail.slug',
    'articles.thumbnail.url',
    'titleQuery',
    'thumbnail.url',
    // 'thumbnail.data',
    'thumbnail.slug',
    'formattedTraffic',
    'trendDate',
  ],
  filterableColumns: { titleQuery: [FilterOperator.EQ] },
};
