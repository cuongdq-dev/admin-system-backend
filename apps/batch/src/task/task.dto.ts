export enum TaskJobName {
  // Crawler related jobs
  CRAWL_DAO_TRUYEN = 'handle-crawler-daotruyen',
  CRAWL_ARTICLES = 'handle-crawler-article',
  FETCH_MISSING_CHAPTERS = 'fetch-chapter-missing',

  // SEO related jobs
  FETCH_SEO_BOOK = 'fetch-seo-book',
  FETCH_GOOGLE_INDEX = 'fetch-google-index',
  FETCH_GOOGLE_META = 'fetch-google-meta-data',
  FETCH_GOOGLE_META_PASSED = 'fetch-google-meta-data-passed',

  // Cleanup jobs
  CLEANUP_OLD_POSTS = 'handle-clean-old-posts',

  // TEST:
  CLEAN_TEMP_FILES = 'test',
}
