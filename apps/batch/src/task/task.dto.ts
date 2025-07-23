export enum TaskJobName {
  // Crawler related jobs
  CRAWL_DAO_TRUYEN = 'handle-crawler-daotruyen',
  CRAWL_ARTICLES = 'handle-crawler-article',
  FETCH_MISSING_CHAPTERS = 'fetch-chapter-missing',

  // SEO related jobs
  FETCH_SEO_BOOK = 'fetch-seo-book',
  NEWS_FETCH_GOOGLE_INDEX = 'news-fetch-google-index',
  NEWS_FETCH_GOOGLE_META = 'news-fetch-google-meta-data',
  NEWS_FETCH_GOOGLE_META_PASSED = 'news-fetch-google-meta-data-passed',

  BOOKS_FETCH_GOOGLE_INDEX = 'books-fetch-google-index',
  BOOKS_FETCH_GOOGLE_META = 'books-fetch-google-meta-data',
  BOOKS_FETCH_GOOGLE_META_PASSED = 'books-fetch-google-meta-data-passed',

  // Cleanup jobs
  CLEANUP_OLD_POSTS = 'handle-clean-old-posts',
  //
  UPDATE_BATCH_LOGS = 'update-logs-status',
  // TEST:
  CLEAN_TEMP_FILES = 'test',
}
