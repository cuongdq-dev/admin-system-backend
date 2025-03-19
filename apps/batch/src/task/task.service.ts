import {
  Category,
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
import { TelegramService } from '@app/modules/telegram/telegram.service';
import { fetchTrendings, generatePostFromHtml, generateSlug } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Not, Repository } from 'typeorm';
import * as googleAuth from 'google-auth-library';
import { IndexStatus } from '@app/entities/site_posts.entity';

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

    private readonly telegramService: TelegramService,
  ) {}

  async onModuleInit() {
    this.logger.log('✅ Module initialized, starting crawler...');
    // await this.handleCleanupOldPosts();
    await this.handleCrawlerArticles();

    // await this.googleIndex();
  }

  async googleIndex() {
    // TODO IF sitePosts.indexing == false --> index
    const unindexedPosts = await this.sitePostRepository.find({
      where: { indexing: true }, // Chỉ lấy những bài chưa được index
      relations: ['post', 'site'],
      select: {
        id: true,
        post_id: true,
        site_id: true,
        post: { slug: true, id: true },
        site: { domain: true, id: true },
        indexing: true,
      },
      take: 10,
    });
    for (const sitePost of unindexedPosts) {
      const { post, site } = sitePost;
      if (!post || !site) continue;

      const postUrl = `${site.domain}/bai-viet/${post.slug}`;
      this.logger.log(`🔍 Indexing: ${postUrl}`);

      const success = await this.submitToGoogleIndex(postUrl);
      if (success) {
        sitePost.indexing = true; // Đánh dấu đã index
        await this.sitePostRepository.save(sitePost);
      }
    }
  }

  async submitToGoogleIndex(url?: string) {
    const serviceAccountBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
    if (!serviceAccountBase64) {
      this.logger.error('❌ GOOGLE_SERVICE_ACCOUNT_BASE64 is missing in .env');
      return false;
    }
    try {
      // 🔹 Decode Base64 về JSON
      const serviceAccountJson = Buffer.from(
        serviceAccountBase64,
        'base64',
      ).toString('utf-8');
      const credentials = JSON.parse(serviceAccountJson);

      // 🔹 Khởi tạo Google Auth Client
      const auth = new googleAuth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/indexing'],
      });

      const client = await auth.getClient();
      // 🔹 Gửi yêu cầu đến Google Indexing API
      const response = await client.request({
        url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
        method: 'POST',
        data: {
          url,
          type: 'URL_UPDATED',
        },
      });

      if (response.status === 200) {
        this.logger.log(`✅ Successfully indexed: ${url}`);
        return true;
      } else {
        this.logger.warn(`⚠️ Failed to index: ${url}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`❌ Google Indexing Error: ${error.message}`);
      return false;
    }
  }

  // @Cron('0 1 * * *')
  async handleCleanupOldPosts() {
    this.logger.debug('START - Cleanup Old Posts.');

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate());

    const oldPosts = await this.postRepository.find({
      where: { created_at: LessThan(fiveDaysAgo) },
      relations: ['categories', 'article', 'sites', 'thumbnail'],
    });

    if (oldPosts.length === 0) {
      this.logger.log('No old posts to delete.');
      return;
    }

    const postIds = oldPosts.map((post) => post.id);
    this.logger.log(`Deleting ${postIds.length} old posts...`);

    for (const post of oldPosts) {
      await this.sitePostRepository.delete({
        post_id: post.id,
      });

      await this.postRepository
        .createQueryBuilder()
        .relation(Post, 'categories')
        .of(post.id)
        .remove(post.categories.map((category) => category.id));

      if (post.article) {
        await this.trendingArticleRepository.delete({ id: post.article_id });
        await this.mediaRepository.delete({ id: post.article.thumbnail_id });
      }

      await this.postRepository.delete(post.id);

      if (post.thumbnail) {
        const isThumbnailUsed = await this.postRepository.count({
          where: { thumbnail_id: post.thumbnail.id },
        });

        if (isThumbnailUsed === 0) {
          await this.mediaRepository.delete(post.thumbnail.id);
        }
      }

      this.logger.log(`Deleted Post ID: ${post.id}`);
    }

    this.logger.debug('END - Cleanup Old Posts.');
  }

  @Cron('0 2 * * *')
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

  @Cron('0 * * * *')
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
        const success = await this.submitToGoogleIndex(
          `${site.domain}/bai-viet/${savedPost.slug}`,
        );

        console.log(success);

        await this.sitePostRepository.insert({
          site_id: site.id,
          post_id: savedPost.id,
          indexing: !!success,
          indexStatus: !!success ? IndexStatus.INDEXING : IndexStatus.ERROR,
        });

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
