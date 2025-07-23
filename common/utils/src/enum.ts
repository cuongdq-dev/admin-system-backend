export enum ServiceStatusEnum {
  INSTALLED = 'installed',
  INSTALLING = 'installing',
  UN_INSTALLED = 'uninstalled',
  FALED = 'failed',
}

export enum workspaceEnum {
  wp_system = 'SYSTEM',
  wp_news = 'POST',
  wp_books = 'BOOK',
}

export const TaskJob = {
  CRAWL_DAO_TRUYEN: { key: 'handle-crawler-daotruyen', name: '' },
  CRAWL_ARTICLES: { key: 'handle-crawler-article', name: '' },
  FETCH_MISSING_CHAPTERS: { key: 'fetch-chapter-missing', name: '' },
  FETCH_SEO_BOOK: { key: 'fetch-seo-book', name: '' },
  NEWS_FETCH_GOOGLE_INDEX: { key: 'news-fetch-google-index', name: '' },
  NEWS_FETCH_GOOGLE_META: { key: 'news-fetch-google-meta-data', name: '' },
  NEWS_FETCH_GOOGLE_META_PASSED: {
    key: 'news-fetch-google-meta-data-passed',
    name: '',
  },
  BOOKS_FETCH_GOOGLE_INDEX: { key: 'books-fetch-google-index', name: '' },
  BOOKS_FETCH_GOOGLE_META: { key: 'books-fetch-google-meta-data', name: '' },
  BOOKS_FETCH_GOOGLE_META_PASSED: {
    key: 'books-fetch-google-meta-data-passed',
    name: '',
  },
  CLEANUP_OLD_POSTS: { key: 'handle-clean-old-posts', name: '' },
  UPDATE_BATCH_LOGS: { key: 'update-logs-status', name: '' },
} as Record<string, { key: string; name: string }>;
