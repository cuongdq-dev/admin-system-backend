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

export const postArchivedPaginateConfig: PaginateConfig<SitePost> = {
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  relations: ['site', 'post', 'post.thumbnail', 'post.categories'],
  select: [
    'post.slug',
    'post.title',
    'post.id',
    'post.meta_description',
    'post.thumbnail.id',
    'post.thumbnail.slug',
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
