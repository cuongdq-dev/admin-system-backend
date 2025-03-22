import {
  Category,
  GoogleIndexRequest,
  Media,
  Notification,
  Post,
  Site,
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
import { IndexStatus } from '@app/entities/site_posts.entity';
import { TelegramService } from '@app/modules/telegram/telegram.service';
import {
  fetchTrendings,
  generatePostFromHtml,
  generateSlug,
  getMetaDataGoogleConsole,
  submitToGoogleIndex,
} from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, MoreThan, Not, Repository } from 'typeorm';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  private readonly botToken = process.env.TELE_BOT_TOKEN;
  private readonly chatId = process.env.TELE_BOT_CHAT_ID;
  constructor(
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

    @InjectRepository(SitePost)
    private readonly sitePostRepository: Repository<SitePost>,

    @InjectRepository(GoogleIndexRequest)
    private readonly googleIndexRequestRepository: Repository<GoogleIndexRequest>,

    private readonly telegramService: TelegramService,
  ) {}

  async onModuleInit() {
    this.logger.log('✅ Module initialized, starting crawler...');
    // await this.handleCleanupOrphanTrending();
    // await this.handleCleanupOldPosts();
    await this.handleCrawlerArticles();
    // await this.googleIndex();
    // await this.googleMetaData();
  }
  @Cron('10 */2 * * *')
  async googleIndex() {
    this.logger.debug('START - Request Google Index.');

    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 18);

    const unindexedPosts = await this.sitePostRepository.find({
      where: {
        indexStatus: In([IndexStatus.NEW, IndexStatus.NEUTRAL]),
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

      const postUrl = `${site.domain}/bai-viet/${post.slug}`;
      this.logger.log(`🔍 Indexing: ${postUrl}`);

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
      }
    }
    this.logger.debug('END - Request Google Index.');
  }

  @Cron('30 */2 * * *')
  async googleMetaData() {
    this.logger.debug('START - Get Google Meta Data.');

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
          type: 'URL_METADATAA',
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
      this.logger.log(`🔍 Indexing: ${postUrl}`);
    }

    this.logger.debug('END - Get Google Meta Data.');
  }

  @Cron('0 1 * * *')
  async handleCleanupOldPosts() {
    this.logger.debug('START - Cleanup Old Posts.');

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 2);

    const oldSitePosts = await this.sitePostRepository.find({
      where: {
        created_at: LessThan(fiveDaysAgo),
        indexStatus: In([IndexStatus.NEUTRAL]),
      },
      relations: ['post', 'post.article', 'post.thumbnail', 'post.categories'],
    });

    if (oldSitePosts.length === 0) {
      this.logger.log('No old posts to delete.');
      return;
    }

    this.logger.log(`Deleting ${oldSitePosts.length} old posts...`);

    for (const sitePost of oldSitePosts) {
      await this.sitePostRepository.delete({ id: sitePost.id });

      if (sitePost?.post?.categories?.length) {
        await this.postRepository
          .createQueryBuilder()
          .relation(Post, 'categories')
          .of(sitePost.post_id)
          .remove(sitePost.post.categories.map((category) => category.id));
      }

      if (sitePost.post.article) {
        await this.trendingArticleRepository.delete({
          id: sitePost.post.article_id,
        });
        await this.mediaRepository.delete({
          id: sitePost.post.article.thumbnail_id,
        });
      }

      if (sitePost.post.thumbnail) {
        const isThumbnailUsed = await this.postRepository.count({
          where: { thumbnail_id: sitePost.post.thumbnail.id },
        });
        if (isThumbnailUsed === 0) {
          await this.mediaRepository.delete(sitePost.post.thumbnail.id);
        }
      }
      await this.postRepository.delete(sitePost.post_id);

      this.logger.log(`Deleted Post ID: ${sitePost.post.id}`);
      await this.handleCleanupOrphanTrending();
    }

    this.logger.debug('END - Cleanup Old Posts.');
  }

  // @Cron('0 3 * * *')
  async handleCleanupOrphanTrending() {
    this.logger.debug('START - Cleanup Orphan Trending.');

    const orphanTrendings = await this.trendingRepository
      .createQueryBuilder('trending')
      .leftJoin(
        'trending_article',
        'article',
        'trending.id = article.trending_id',
      )
      .where('article.id IS NULL')
      .select(['trending.id', 'trending.thumbnail_id'])
      .getMany();

    if (orphanTrendings.length === 0) {
      this.logger.log('No orphan trendings to delete.');
      return;
    }

    const trendingIds = orphanTrendings.map((t) => t.id);
    const thumbnailIds = orphanTrendings
      .map((t) => t.thumbnail_id)
      .filter((id) => id !== null);

    this.logger.log(`Deleting ${trendingIds.length} orphan trendings...`);

    await this.trendingRepository.delete(trendingIds);

    for (const thumbnailId of thumbnailIds) {
      const isStillUsed = await this.trendingRepository.count({
        where: { thumbnail_id: thumbnailId },
      });

      if (isStillUsed === 0) {
        await this.mediaRepository.delete(thumbnailId);
        this.logger.log(`Deleted unused thumbnail ID: ${thumbnailId}`);
      }
    }

    this.logger.debug('END - Cleanup Orphan Trending.');
  }

  @Cron('0 */2 * * *')
  async handleCrawlerArticles() {
    this.logger.debug('START - Crawler Articles.');

    const trendingList = await fetchTrendings();
    const admins = await this.userRepository.find({
      where: { firebase_token: Not(IsNull()) },
    });

    const categoryData = await this.categoryRepository.find();
    const categoryList = categoryData.map((category) => {
      return { name: category.name, slug: category.slug };
    });
    for (const trending of trendingList) {
      this.logger.debug(
        `Processing Trending Topic: "${trending.title.query}" | Posts: ${trending?.articles?.length || 0}`,
      );

      const trendingData = await this.processTrending(trending);

      if (trending?.articles?.length) {
        await this.processArticles(
          trending.articles,
          trendingData.id,
          categoryList,
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
        },
        {
          conflictPaths: ['slug'],
        },
      );

      const thumbnailId = thumbnail.generatedMaps[0]?.id;

      trendingData.thumbnail_id = thumbnailId;

      this.logger.debug(
        `Trending Thumbnail Saved | ID: ${thumbnailId} | Query: "${trendingData.titleQuery}"`,
      );
    }

    const resultTrending = await this.trendingRepository.upsert(trendingData, {
      conflictPaths: ['titleQuery'],
    });

    const savedTrending = resultTrending.generatedMaps[0];

    this.logger.debug(
      `Trending Data Saved | ID: ${savedTrending?.id} | Query: "${trendingData.titleQuery}"`,
    );

    return savedTrending;
  }

  private async processArticles(
    articles: any[],
    trendingId: string,
    categories: { name: string; slug: string }[],
  ) {
    for (const article of articles) {
      this.logger.debug(
        `Processing Article: "${article.title}" | Source: ${article.source}`,
      );

      const articleData = {
        title: article.title,
        source: article.source,
        url: article.url,
        trending_id: trendingId,
        thumbnail_id: undefined,
      };

      const articleSlug = generateSlug(article.title);

      if (article?.image?.imageUrl) {
        const thumbnail = await this.mediaRepository.upsert(
          {
            filename: articleData.title,
            slug: generateSlug(`thumbnail article ${articleSlug}`),
            storage_type: StorageType.URL,
            url: article.image.imageUrl,
            mimetype: 'url',
          },
          { conflictPaths: ['slug'] },
        );
        const thumbnailId = thumbnail.generatedMaps[0]?.id;
        articleData.thumbnail_id = thumbnailId;

        this.logger.debug(
          `Article Thumbnail Saved | ID: ${thumbnailId} | Slug: "${articleSlug}"`,
        );
      }

      if (article.url) {
        const postContent = await generatePostFromHtml({
          title: article.title,
          url: article.url,
        });

        if (postContent?.content) {
          const savedArticle = await this.saveArticle(articleData, postContent);

          this.logger.debug(
            `Article Saved | ID: ${savedArticle.id} | Title: "${article.title}"`,
          );

          const savedPost = await this.savePost(
            savedArticle.id,
            postContent,
            articleData,
            categories,
            postContent.thumbnail,
          );
          savedPost &&
            this.logger.debug(
              `Post Saved | ID: ${savedPost.id} | Content Length: ${postContent.content.length} | Description: "${postContent.description}"`,
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
      content?: string;
      keywords?: { query: string }[];
      description?: string;
      contentStatus?: PostStatus;
    },
    articleData: any,
    categories: { name: string; slug: string }[],
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
    const slug = generateSlug(articleData.title);

    const existingPost = await this.postRepository.findOne({
      where: { slug },
    });

    if (existingPost) return existingPost;

    const thumbnailUpsert = await this.mediaRepository.upsert(thumbnail, {
      conflictPaths: ['slug'],
    });

    const newPost = this.postRepository.create({
      content: postContent.content,
      title: articleData.title,
      thumbnail_id: thumbnailUpsert?.generatedMaps[0]?.id,
      slug,
      meta_description: postContent.description,
      relatedQueries: postContent?.keywords?.map((keyword) => {
        return { query: keyword.query, slug: generateSlug(keyword.query) };
      }),
      status: postContent.contentStatus,
      article_id: articleId,
    });

    const savedPost = await this.postRepository.save(newPost);
    await this.telegramService.sendMessageWithPost(
      this.chatId,
      this.botToken,
      savedPost,
      categories,
    );

    if (savedPost.status === PostStatus.PUBLISHED) {
      const autoPostSites = await this.siteRepository.find({
        where: { autoPost: true },
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

        await this.telegramService.sendMessageWithPost(
          site.teleChatId,
          site.teleToken,
          savedPost,
          site.categories,
        );
      }
    }

    return savedPost;
  }
}
