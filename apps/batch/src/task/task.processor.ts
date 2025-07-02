import {
  BatchLogs,
  Book,
  Category,
  GoogleIndexBookRequest,
  GoogleIndexRequest,
  Media,
  Notification,
  Post,
  Site,
  SiteBook,
  SitePost,
  StorageType,
  Trending,
  TrendingArticle,
  User,
} from '@app/entities';
import {
  NotificationStatus,
  NotificationType,
} from '@app/entities/notification.entity';
import { PostStatus } from '@app/entities/post.entity';
import { SiteType } from '@app/entities/site.entity';
import { IndexStatus } from '@app/entities/site_posts.entity';
import { CrawlService } from '@app/modules/crawl-data/crawl.service';
// import { TelegramService } from '@app/modules/telegram/telegram.service';
import {
  fetchTrendings,
  generatePostFromHtml,
  generateSlug,
  getMetaDataGoogleConsole,
  submitToGoogleIndex,
} from '@app/utils';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  IsNull,
  LessThan,
  MoreThan,
  Not,
  Repository,
} from 'typeorm';
import { TaskJobName } from './task.dto';
import { Job } from 'bull';
import { BatchLogsService } from '@app/modules/batch-logs/batch-log.service';

@Processor('task-queue') // Tên queue
export class TaskProcessor {
  private readonly logger = new Logger(TaskProcessor.name);
  // private readonly botToken = process.env.TELE_BOT_TOKEN;
  // private readonly chatId = process.env.TELE_BOT_CHAT_ID;
  constructor(
    private readonly batchLogsService: BatchLogsService,

    @InjectRepository(Trending)
    private readonly trendingRepository: Repository<Trending>,

    @InjectRepository(TrendingArticle)
    private readonly trendingArticleRepository: Repository<TrendingArticle>,

    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,

    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,

    @InjectRepository(SitePost)
    private readonly sitePostRepository: Repository<SitePost>,

    @InjectRepository(SiteBook)
    private readonly siteBookRepository: Repository<SiteBook>,

    @InjectRepository(GoogleIndexRequest)
    private readonly googleIndexRequestRepository: Repository<GoogleIndexRequest>,

    @InjectRepository(GoogleIndexBookRequest)
    private readonly bookGoogleIndexRequestRepository: Repository<GoogleIndexBookRequest>,

    // private readonly telegramService: TelegramService,

    private readonly crawlService: CrawlService,

    private readonly dataSource: DataSource,
  ) {}

  @Process(TaskJobName.CRAWL_DAO_TRUYEN)
  async handleCrawlerDaotruyen(job: Job<{ time: string; log_id: string }>) {
    const logId = job.data.log_id;
    const messages: string[] = [];

    await this.batchLogsService.start(logId);

    try {
      await this.crawlService.handleCrawlerDaoTruyen();
      messages.push('✅ Đã crawl truyện thành công');
      await this.batchLogsService.success(logId, messages);
    } catch (error) {
      this.logger.error(
        `❌ handleCrawlerDaotruyen: ${error.message}`,
        error.stack,
      );
      await this.batchLogsService.fail(logId, error.message, messages);
    }
  }

  @Process(TaskJobName.FETCH_MISSING_CHAPTERS)
  async fetchChapterMissing(job: Job<{ time: string; log_id: string }>) {
    const logId = job.data.log_id;
    const messages: string[] = [];

    await this.batchLogsService.start(logId);

    try {
      await this.crawlService.fetchChapters();
      messages.push('✅ Đã fetch missing chapters');
      await this.batchLogsService.success(logId, messages);
    } catch (error) {
      this.logger.error(
        `❌ fetchChapterMissing: ${error?.message}`,
        error.stack,
      );
      await this.batchLogsService.fail(logId, error?.message, messages);
    }
  }

  @Process(TaskJobName.FETCH_SEO_BOOK)
  async fetchSEOBook(job: Job<{ time: string; log_id: string }>) {
    const logId = job.data.log_id;
    const messages: string[] = [];

    await this.batchLogsService.start(logId);

    try {
      const books = await this.bookRepository
        .createQueryBuilder('book')
        .select([
          'book.description',
          'book.title',
          'book.id',
          'book.slug',
          'book.source_url',
          'book.author',
        ])
        .orderBy('created_at', 'DESC')
        .where('book.social_description = :emptyObj', { emptyObj: '{}' })
        .take(20)
        .getMany();

      for (const book of books) {
        const geminiData = await this.crawlService.generateGeminiBook(book);

        await this.bookRepository.upsert(
          {
            social_description: geminiData,
            title: book.title,
            id: book.id,
            slug: book.slug,
          },
          {
            conflictPaths: ['title', 'slug'],
            skipUpdateIfNoValuesChanged: true,
          },
        );

        const msg = `✅ Updated SEO book: ${book.title}`;
        this.logger.debug(`END: ${book.title}`);
        messages.push(msg);
      }

      await this.batchLogsService.success(logId, messages);
    } catch (error) {
      this.logger.error(`❌ fetchSEOBook: ${error.message}`, error.stack);
      await this.batchLogsService.fail(logId, error.message, messages);
    }
  }

  // BOOK
  @Process(TaskJobName.BOOKS_FETCH_GOOGLE_INDEX)
  async googleIndexBooks(job: Job<{ time: string; log_id: string }>) {
    const logId = job.data.log_id;
    const messages: string[] = [];

    await this.batchLogsService.start(logId);
    this.logger.debug('START - Request Google Index.');

    try {
      const sixHoursAgo = new Date();
      sixHoursAgo.setHours(sixHoursAgo.getHours() - 18);

      const unindexedBooks = await this.siteBookRepository.find({
        where: {
          indexStatus: In([IndexStatus.NEW]),
          created_at: MoreThan(sixHoursAgo),
        },
        relations: ['book', 'site'],
        select: {
          id: true,
          book_id: true,
          site_id: true,
          book: { slug: true, id: true },
          site: { domain: true, id: true },
        },
      });

      for (const siteBoook of unindexedBooks) {
        const { book, site } = siteBoook;
        if (!book || !site) continue;

        const googleResulted =
          await this.bookGoogleIndexRequestRepository.findOne({
            where: { site_id: site.id, book_id: book.id, type: 'URL_UPDATED' },
          });

        if (googleResulted?.response?.urlNotificationMetadata?.url) continue;

        const bookUrl = `${site.domain}/${book.slug}`;
        this.logger.log(`🔍 Indexing: ${bookUrl}`);
        messages.push(`Indexing: ${bookUrl}`);

        const success = await submitToGoogleIndex(bookUrl);

        await this.bookGoogleIndexRequestRepository.upsert(
          {
            book_id: siteBoook.book_id,
            site_id: siteBoook.site_id,
            book_slug: siteBoook.book.slug,
            site_domain: siteBoook.site.domain,
            url: bookUrl,
            googleUrl:
              'https://indexing.googleapis.com/v3/urlNotifications:publish',
            type: 'URL_UPDATED',
            response: success,
            requested_at: new Date(),
          },
          {
            conflictPaths: ['type', 'book_slug'],
            skipUpdateIfNoValuesChanged: true,
          },
        );

        if (success) {
          await this.siteBookRepository.save({
            ...siteBoook,
            indexStatus: IndexStatus.INDEXING,
          });
          messages.push(`✅ Success: ${bookUrl}`);
        } else {
          messages.push(`❌ Failed: ${bookUrl}`);
        }
      }

      this.logger.debug('END - Request Google Index.');
      await this.batchLogsService.success(logId, messages);
    } catch (error) {
      this.logger.error('Google Index Job Failed:', error);
      await this.batchLogsService.fail(logId, error.message, messages);
    }
  }

  @Process(TaskJobName.BOOKS_FETCH_GOOGLE_META)
  async googleMetaDataBooks(job: Job<{ time: string; log_id: string }>) {
    const logId = job.data.log_id;
    const messages: string[] = [];

    await this.batchLogsService.start(logId);

    this.logger.debug('START - Get Google Meta Data.');

    try {
      const indexedBooks = await this.siteBookRepository.find({
        where: {
          indexStatus: In([
            IndexStatus.NEW,
            IndexStatus.INDEXING,
            IndexStatus.VERDICT_UNSPECIFIED,
            IndexStatus.NEUTRAL,
          ]),
        },
        relations: ['book', 'site'],
        select: {
          id: true,
          book_id: true,
          site_id: true,
          book: { slug: true, id: true },
          site: { domain: true, id: true },
        },
      });

      for (const siteBook of indexedBooks) {
        const { book, site } = siteBook;
        if (!book || !site) continue;

        const bookUrl = `${site.domain}/bai-viet/${book.slug}`;

        const success = await getMetaDataGoogleConsole(
          bookUrl,
          site.domain + '/',
        );

        await this.bookGoogleIndexRequestRepository.upsert(
          {
            book_id: siteBook.book_id,
            site_id: siteBook.site_id,
            book_slug: siteBook.book.slug,
            site_domain: siteBook.site.domain,
            url: bookUrl,
            googleUrl:
              'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
            type: 'URL_METADATA',
            response: success,
            requested_at: new Date(),
          },
          {
            conflictPaths: ['type', 'book_slug'],
            skipUpdateIfNoValuesChanged: true,
          },
        );

        if (success) {
          const verdict = success?.inspectionResult?.indexStatusResult?.verdict;
          if (!!verdict) {
            siteBook.indexStatus = verdict;
            siteBook.indexState = success;
          }
          await this.siteBookRepository.save(siteBook);
        }

        const msg = `🔍 Indexed: ${bookUrl}`;
        this.logger.log(msg);
        messages.push(msg);
      }

      this.logger.debug('END - Get Google Meta Data.');
      await this.batchLogsService.success(logId, messages);
    } catch (error) {
      this.logger.error(`❌ googleMetaDataNews: ${error.message}`, error.stack);
      await this.batchLogsService.fail(logId, error.message, messages);
    }
  }

  @Process(TaskJobName.BOOKS_FETCH_GOOGLE_META_PASSED)
  async googleMetaDataPassedBooks(job: Job<{ time: string; log_id: string }>) {
    this.logger.debug('START - Get Google Meta Data.');

    const logId = job.data.log_id;
    const messages: string[] = [];

    await this.batchLogsService.start(logId);

    try {
      const indexedBooks = await this.siteBookRepository.find({
        where: {
          indexStatus: In([IndexStatus.PASS]),
        },
        relations: ['book', 'site'],
        select: {
          id: true,
          book_id: true,
          site_id: true,
          book: { slug: true, id: true },
          site: { domain: true, id: true },
        },
      });

      for (const siteBook of indexedBooks) {
        const { book, site } = siteBook;
        if (!book || !site) continue;

        const bookUrl = `${site.domain}/bai-viet/${book.slug}`;
        const success = await getMetaDataGoogleConsole(
          bookUrl,
          site.domain + '/',
        );

        await this.bookGoogleIndexRequestRepository.upsert(
          {
            book_id: siteBook.book_id,
            site_id: siteBook.site_id,
            book_slug: siteBook.book.slug,
            site_domain: siteBook.site.domain,
            url: bookUrl,
            googleUrl:
              'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
            type: 'URL_METADATA',
            response: success,
            requested_at: new Date(),
          },
          {
            conflictPaths: ['type', 'book_slug'],
            skipUpdateIfNoValuesChanged: true,
          },
        );

        if (success) {
          const verdict = success?.inspectionResult?.indexStatusResult?.verdict;
          if (!!verdict) {
            siteBook.indexStatus = verdict;
            siteBook.indexState = success;
          }
          await this.siteBookRepository.save(siteBook);
        }

        const msg = `🔍 Meta checked: ${bookUrl}`;
        this.logger.log(msg);
        messages.push(msg);
      }

      await this.batchLogsService.success(logId, messages);
    } catch (error) {
      this.logger.error(
        `❌ Error in googleMetaDataPassedNews: ${error.message}`,
        error.stack,
      );
      await this.batchLogsService.fail(logId, error.message, messages);
    }

    this.logger.debug('END - Get Google Meta Data.');
  }
  //

  // NEWS

  @Process(TaskJobName.NEWS_FETCH_GOOGLE_INDEX)
  async googleIndexNews(job: Job<{ time: string; log_id: string }>) {
    const logId = job.data.log_id;
    const messages: string[] = [];

    await this.batchLogsService.start(logId);
    this.logger.debug('START - Request Google Index.');

    try {
      const sixHoursAgo = new Date();
      sixHoursAgo.setHours(sixHoursAgo.getHours() - 18);

      const unindexedPosts = await this.sitePostRepository.find({
        where: {
          indexStatus: In([IndexStatus.NEW]),
          created_at: MoreThan(sixHoursAgo),
        },
        relations: ['post', 'site'],
        select: {
          id: true,
          post_id: true,
          site_id: true,
          post: { slug: true, id: true },
          site: { domain: true, id: true },
        },
      });

      for (const sitePost of unindexedPosts) {
        const { post, site } = sitePost;
        if (!post || !site) continue;

        const googleResulted = await this.googleIndexRequestRepository.findOne({
          where: { site_id: site.id, post_id: post.id, type: 'URL_UPDATED' },
        });

        if (googleResulted?.response?.urlNotificationMetadata?.url) continue;

        const postUrl = `${site.domain}/bai-viet/${post.slug}`;
        this.logger.log(`🔍 Indexing: ${postUrl}`);
        messages.push(`Indexing: ${postUrl}`);

        const success = await submitToGoogleIndex(postUrl);

        await this.googleIndexRequestRepository.upsert(
          {
            post_id: sitePost.post_id,
            site_id: sitePost.site_id,
            post_slug: sitePost.post.slug,
            site_domain: sitePost.site.domain,
            url: postUrl,
            googleUrl:
              'https://indexing.googleapis.com/v3/urlNotifications:publish',
            type: 'URL_UPDATED',
            response: success,
            requested_at: new Date(),
          },
          {
            conflictPaths: ['type', 'post_slug'],
            skipUpdateIfNoValuesChanged: true,
          },
        );

        if (success) {
          await this.sitePostRepository.save({
            ...sitePost,
            indexStatus: IndexStatus.INDEXING,
          });
          messages.push(`✅ Success: ${postUrl}`);
        } else {
          messages.push(`❌ Failed: ${postUrl}`);
        }
      }

      this.logger.debug('END - Request Google Index.');
      await this.batchLogsService.success(logId, messages);
    } catch (error) {
      this.logger.error('Google Index Job Failed:', error);
      await this.batchLogsService.fail(logId, error.message, messages);
    }
  }

  @Process(TaskJobName.NEWS_FETCH_GOOGLE_META)
  async googleMetaDataNews(job: Job<{ time: string; log_id: string }>) {
    const logId = job.data.log_id;
    const messages: string[] = [];

    await this.batchLogsService.start(logId);

    this.logger.debug('START - Get Google Meta Data.');

    try {
      const indexedPosts = await this.sitePostRepository.find({
        where: {
          indexStatus: In([
            IndexStatus.NEW,
            IndexStatus.INDEXING,
            IndexStatus.VERDICT_UNSPECIFIED,
            IndexStatus.NEUTRAL,
          ]),
        },
        relations: ['post', 'site'],
        select: {
          id: true,
          post_id: true,
          site_id: true,
          post: { slug: true, id: true },
          site: { domain: true, id: true },
        },
      });

      for (const sitePost of indexedPosts) {
        const { post, site } = sitePost;
        if (!post || !site) continue;

        const postUrl = `${site.domain}/bai-viet/${post.slug}`;

        const success = await getMetaDataGoogleConsole(
          postUrl,
          site.domain + '/',
        );

        await this.googleIndexRequestRepository.upsert(
          {
            post_id: sitePost.post_id,
            site_id: sitePost.site_id,
            post_slug: sitePost.post.slug,
            site_domain: sitePost.site.domain,
            url: postUrl,
            googleUrl:
              'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
            type: 'URL_METADATA',
            response: success,
            requested_at: new Date(),
          },
          {
            conflictPaths: ['type', 'post_slug'],
            skipUpdateIfNoValuesChanged: true,
          },
        );

        if (success) {
          const verdict = success?.inspectionResult?.indexStatusResult?.verdict;
          if (!!verdict) {
            sitePost.indexStatus = verdict;
            sitePost.indexState = success;
          }
          await this.sitePostRepository.save(sitePost);
        }

        const msg = `🔍 Indexed: ${postUrl}`;
        this.logger.log(msg);
        messages.push(msg);
      }

      this.logger.debug('END - Get Google Meta Data.');
      await this.batchLogsService.success(logId, messages);
    } catch (error) {
      this.logger.error(`❌ googleMetaDataNews: ${error.message}`, error.stack);
      await this.batchLogsService.fail(logId, error.message, messages);
    }
  }

  @Process(TaskJobName.NEWS_FETCH_GOOGLE_META_PASSED)
  async googleMetaDataPassedNews(job: Job<{ time: string; log_id: string }>) {
    this.logger.debug('START - Get Google Meta Data.');

    const logId = job.data.log_id;
    const messages: string[] = [];

    await this.batchLogsService.start(logId);

    try {
      const indexedPosts = await this.sitePostRepository.find({
        where: {
          indexStatus: In([IndexStatus.PASS]),
        },
        relations: ['post', 'site'],
        select: {
          id: true,
          post_id: true,
          site_id: true,
          post: { slug: true, id: true },
          site: { domain: true, id: true },
        },
      });

      for (const sitePost of indexedPosts) {
        const { post, site } = sitePost;
        if (!post || !site) continue;

        const postUrl = `${site.domain}/bai-viet/${post.slug}`;
        const success = await getMetaDataGoogleConsole(
          postUrl,
          site.domain + '/',
        );

        await this.googleIndexRequestRepository.upsert(
          {
            post_id: sitePost.post_id,
            site_id: sitePost.site_id,
            post_slug: sitePost.post.slug,
            site_domain: sitePost.site.domain,
            url: postUrl,
            googleUrl:
              'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
            type: 'URL_METADATA',
            response: success,
            requested_at: new Date(),
          },
          {
            conflictPaths: ['type', 'post_slug'],
            skipUpdateIfNoValuesChanged: true,
          },
        );

        if (success) {
          const verdict = success?.inspectionResult?.indexStatusResult?.verdict;
          if (!!verdict) {
            sitePost.indexStatus = verdict;
            sitePost.indexState = success;
          }
          await this.sitePostRepository.save(sitePost);
        }

        const msg = `🔍 Meta checked: ${postUrl}`;
        this.logger.log(msg);
        messages.push(msg);
      }

      await this.batchLogsService.success(logId, messages);
    } catch (error) {
      this.logger.error(
        `❌ Error in googleMetaDataPassedNews: ${error.message}`,
        error.stack,
      );
      await this.batchLogsService.fail(logId, error.message, messages);
    }

    this.logger.debug('END - Get Google Meta Data.');
  }
  //
  @Process(TaskJobName.CLEANUP_OLD_POSTS)
  async handleCleanupOldPosts(job: Job<{ time: string; log_id: string }>) {
    const logId = job.data.log_id;
    const messages: string[] = [];

    await this.batchLogsService.start(logId);
    this.logger.debug('START - Cleanup Old Posts.');

    try {
      const orphanTrending = await this.trendingRepository
        .createQueryBuilder('trending')
        .leftJoinAndSelect('trending.thumbnail', 'thumbnail')
        .leftJoinAndSelect('trending.articles', 'articles')
        .leftJoinAndSelect('articles.posts', 'articles_posts')
        .where('articles_posts.id IS NULL OR articles.id IS NULL')
        .getMany();

      for (const trending of orphanTrending) {
        await this.dataSource.transaction(async (manager) => {
          await manager.delete(Trending, { id: trending.id });
          await manager.softDelete(Media, { id: trending.thumbnail_id });
        });
        messages.push(`🧹 Deleted orphan trending ID: ${trending.id}`);
      }

      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 2);

      const oldSitePosts = await this.sitePostRepository.find({
        where: {
          created_at: LessThan(fiveDaysAgo),
          indexStatus: In([
            IndexStatus.NEW,
            IndexStatus.INDEXING,
            IndexStatus.DELETED,
            IndexStatus.NEUTRAL,
            IndexStatus.DELETED,
          ]),
        },
      });

      if (oldSitePosts.length === 0) {
        const msg = 'No old posts to delete.';
        this.logger.log(msg);
        messages.push(msg);
      } else {
        const msg = `Deleting ${oldSitePosts.length} old posts...`;
        this.logger.log(msg);
        messages.push(msg);

        for (const [index, sitePost] of oldSitePosts.entries()) {
          try {
            const progressMsg = `Deleting post ${index + 1}/${oldSitePosts.length} - sitePost.id: ${sitePost.id}`;
            this.logger.debug(progressMsg);
            messages.push(progressMsg);

            const deleted = await this.deletePostArchived(sitePost);
            const successMsg = `✔ Deleted post ID ${deleted.deleted?.post?.id ?? 'N/A'} - "${deleted.deleted?.post?.title}"`;
            this.logger.verbose(successMsg);
            messages.push(successMsg);
          } catch (err) {
            const errMsg = `❌ Failed to delete sitePost ID ${sitePost.id}: ${err.message}`;
            this.logger.error(errMsg, err.stack);
            messages.push(errMsg);
          }
        }
      }

      this.logger.debug('END - Cleanup Old Posts.');
      await this.batchLogsService.success(logId, messages);
    } catch (error) {
      this.logger.error(`❌ Cleanup error: ${error.message}`, error.stack);
      await this.batchLogsService.fail(logId, error.message, messages);
    }
  }

  @Process(TaskJobName.CRAWL_ARTICLES)
  async handleCrawlerArticles(job: Job<{ time: string; log_id: string }>) {
    const logId = job.data.log_id;
    const messages: string[] = [];

    await this.batchLogsService.start(logId);
    this.logger.debug('START - Crawler Articles.');

    try {
      const trendingList = await fetchTrendings();

      const admins = await this.userRepository.find({
        where: { firebase_token: Not(IsNull()) },
      });

      const categoryData = await this.categoryRepository.find();
      const categoryList = categoryData.map((category) => {
        return { name: category.name, slug: category.slug };
      });

      for (const trending of trendingList) {
        const trendingData = await this.processTrending(trending);
        messages.push(`📌 Processed trending: ${trending?.title?.query}`);

        if (trending?.articles?.length) {
          await this.processArticles(
            trending.articles,
            trendingData.id,
            categoryList,
          );
          messages.push(
            `📝 Processed ${trending?.articles?.length} articles for trending "${trending?.title?.query}"`,
          );
        }
      }

      for (const admin of admins) {
        const notify = this.notificationRepository.create({
          title: `New Posts Available `,
          message: `Please check them out!`,
          status: NotificationStatus.NEW,
          type: NotificationType.SYSTEM,
          user_id: admin.id,
        });
        await this.notificationRepository.save(notify);
      }

      this.logger.debug('END - Crawler Articles.');
      await this.batchLogsService.success(logId, messages);
    } catch (error) {
      this.logger.error(
        `❌ CRAWL_ARTICLES error: ${error.message}`,
        error.stack,
      );
      await this.batchLogsService.fail(logId, error.message, messages);
    }
  }

  private async processTrending(trending: any) {
    const trendingData = {
      titleQuery: trending.title.query,
      titleExploreLink: trending.title.exploreLink,
      formattedTraffic: trending.formattedTraffic,
      trendDate: trending.trendDate,
      relatedQueries: [],
      shareUrl: trending.shareUrl,
      thumbnail_id: undefined,
    };

    if (trending?.image?.imageUrl) {
      const thumbnail = await this.mediaRepository.upsert(
        {
          filename: trendingData.titleQuery,
          slug: generateSlug(`thumbnail trending ${trendingData.titleQuery}`),
          storage_type: StorageType.URL,
          url: trending.image.imageUrl,
          mimetype: 'url',
          deleted_at: null,
          deleted_by: null,
        },
        {
          conflictPaths: ['slug'],
        },
      );

      const thumbnailId = thumbnail.generatedMaps[0]?.id;

      trendingData.thumbnail_id = thumbnailId;
    }

    const resultTrending = await this.trendingRepository.upsert(trendingData, {
      conflictPaths: ['titleQuery'],
    });

    const savedTrending = resultTrending.generatedMaps[0];

    return savedTrending;
  }

  private async processArticles(
    articles: any[],
    trendingId: string,
    categories: { name: string; slug: string }[],
  ) {
    for (const article of articles) {
      const articleData = {
        title: article.title,
        source: article.source,
        url: article.url,
        trending_id: trendingId,
        thumbnail_id: undefined,
      };

      const articleSlug = generateSlug(article.title);

      if (article.url) {
        const postContent = await generatePostFromHtml({
          title: article.title,
          url: article.url,
          categories,
        });

        if (postContent?.content) {
          if (article?.image?.imageUrl) {
            const thumbnail = await this.mediaRepository.upsert(
              {
                filename: articleData.title,
                slug: generateSlug(`thumbnail article ${articleSlug}`),
                storage_type: StorageType.URL,
                url: article.image.imageUrl,
                mimetype: 'url',
                deleted_at: null,
                deleted_by: null,
              },
              { conflictPaths: ['slug'] },
            );
            const thumbnailId = thumbnail.generatedMaps[0]?.id;
            articleData.thumbnail_id = thumbnailId;
          }

          const savedArticle = await this.saveArticle(articleData, postContent);

          await this.savePost(
            savedArticle.id,
            postContent,
            categories,
            postContent.thumbnail,
          );
        }
      }
    }
  }

  private async saveArticle(articleData: any, postContent: any) {
    const resultArticle = await this.trendingArticleRepository.upsert(
      {
        ...articleData,
        meta_description: postContent.description,
        relatedQueries: postContent?.keywords?.map((keyword) => {
          return { query: keyword.query, slug: generateSlug(keyword.query) };
        }),
        slug: generateSlug(articleData.title),
      },
      { conflictPaths: ['url', 'title'] },
    );

    return resultArticle.generatedMaps[0];
  }

  private async savePost(
    articleId: string,
    postContent: {
      title?: string;
      content?: string;
      keywords?: { query: string }[];
      description?: string;
      contentStatus?: PostStatus;
      category?: { id: string; name?: string; slug?: string };
    },
    categories?: { name: string; slug: string }[],
    thumbnail?: Media,
  ) {
    if (!postContent.content) {
      console.log('------------>   Post Content undefined');
      return;
    }
    if (!thumbnail) {
      console.log('------------>   Thumbnail Post undefined');
      return;
    }
    const slug = generateSlug(postContent.title);

    const existingPost = await this.postRepository.findOne({
      where: { slug },
    });

    if (existingPost) return existingPost;

    const thumbnailUpsert = await this.mediaRepository.upsert(
      { ...thumbnail, deleted_at: null, deleted_by: null },
      {
        conflictPaths: ['slug'],
      },
    );

    const category = await this.categoryRepository.findOne({
      where: { slug: postContent?.category?.slug },
    });

    const newPost = this.postRepository.create({
      content: postContent.content,
      title: postContent.title,
      thumbnail_id: thumbnailUpsert?.generatedMaps[0]?.id,
      slug,
      meta_description: postContent.description,
      relatedQueries: postContent?.keywords?.map((keyword) => {
        return { query: keyword.query, slug: generateSlug(keyword.query) };
      }),
      categories: [category],
      status: postContent.contentStatus,
      article_id: articleId,
    });

    const savedPost = await this.postRepository.save(newPost);

    // await this.telegramService.sendMessageWithPost(
    //   this.chatId,
    //   this.botToken,
    //   savedPost,
    //   categories,
    // );

    if (savedPost.status === PostStatus.PUBLISHED) {
      const autoPostSites = await this.siteRepository.find({
        where: { autoPost: true, type: SiteType.POST },
        relations: ['categories'],
        select: [
          'categories',
          'autoPost',
          'teleChatId',
          'teleToken',
          'id',
          'domain',
        ],
      });

      for (const site of autoPostSites) {
        const success = await submitToGoogleIndex(
          `${site.domain}/bai-viet/${savedPost.slug}`,
        );
        // const siteCategories = await this.categoryRepository.find({
        //   where: { sites: { id: site.id } },
        // });
        await this.sitePostRepository.upsert(
          {
            site_id: site.id,
            post_id: savedPost.id,
            indexStatus: !!success ? IndexStatus.INDEXING : IndexStatus.NEW,
          },
          { conflictPaths: ['site_id', 'post_id'] },
        );

        await this.googleIndexRequestRepository.upsert(
          {
            post_id: savedPost.id,
            site_id: site.id,
            post_slug: savedPost.slug,
            site_domain: site.domain,
            url: `${site.domain}/bai-viet/${savedPost.slug}`,
            googleUrl:
              'https://indexing.googleapis.com/v3/urlNotifications:publish',
            type: 'URL_UPDATED',
            response: success,
            requested_at: new Date(),
          },
          {
            conflictPaths: ['type', 'post_slug'],
            skipUpdateIfNoValuesChanged: true,
          },
        );

        // await this.telegramService.sendMessageWithPost(
        //   site.teleChatId,
        //   site.teleToken,
        //   savedPost,
        //   site.categories,
        // );
      }
    }

    return savedPost;
  }

  // DELETE POST ARCHIVERD
  async deletePostArchived(sitePost: SitePost) {
    const postId = sitePost.post_id;
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['article', 'article.trending', 'categories'],
      select: ['id', 'slug', 'title', 'thumbnail_id', 'article', 'categories'],
    });

    const {
      id: post_id,
      title: post_title,
      slug: post_slug,
      thumbnail_id: post_thumbnail_id,
      article,
      categories,
    } = post || {
      post_id: undefined,
      title: undefined,
      slug: undefined,
      thumbnail_id: undefined,
      article: undefined,
      categories: undefined,
    };

    const deletedData = {
      sitePost: {
        id: sitePost.id,
        site_id: sitePost.site_id,
        post_id: sitePost.post_id,
        created_at: sitePost.created_at,
      },
      post: {
        id: post_id,
        title: post_title,
        slug: post_slug,
        thumbnail_id: post_thumbnail_id,
      },
      article: article && {
        id: article.id,
        title: article.title,
        thumbnail_id: article.thumbnail_id,
      },
      trending: article?.trending && {
        id: article.trending.id,
        title: article.trending.titleQuery,
        thumbnail_id: article.trending.thumbnail_id,
      },
      mediaIds: {
        post: post_thumbnail_id,
        article: article?.thumbnail_id,
        trending: article?.trending?.thumbnail_id,
      },
      categories: categories?.map((c) => ({
        id: c.id,
        name: c.name,
      })),
    };

    const categoryIds = categories?.map((c) => c.id);

    await this.dataSource.transaction(async (manager) => {
      if (sitePost.id) {
        await manager.delete(SitePost, { id: sitePost.id });
      }

      if (Number(categoryIds?.length) > 0) {
        await manager
          .createQueryBuilder()
          .delete()
          .from('category_posts')
          .where('post_id = :postId', { postId: post_id })
          .execute();
      }

      post_id && (await manager.delete(Post, { id: post_id }));

      article?.id &&
        (await manager.delete(TrendingArticle, { id: article.id }));

      article?.trending_id &&
        (await manager.delete(Trending, { id: article.trending_id }));

      if (post_thumbnail_id) {
        try {
          await this.mediaRepository.softDelete({ id: post_thumbnail_id });
        } catch (error) {
          console.log(
            `POST Media with ID ${post_thumbnail_id} could not be deleted. Skipping...`,
          );
        }
      }

      if (article?.thumbnail_id) {
        try {
          await this.mediaRepository.softDelete({ id: article.thumbnail_id });
        } catch (error) {
          console.log(
            `ARTICLE Media with ID ${article.thumbnail_id} could not be deleted. Skipping...`,
          );
        }
      }

      if (article?.trending?.thumbnail_id) {
        try {
          await this.mediaRepository.softDelete({
            id: article.trending.thumbnail_id,
          });
        } catch (error) {
          console.log(
            `TRENDING Media with ID ${article.trending.thumbnail_id} could not be deleted. Skipping...`,
          );
        }
      }
    });

    return {
      message: 'Post and related data deleted successfully',
      deleted: deletedData,
    };
  }
}
