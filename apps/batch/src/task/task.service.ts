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
    await this.handleCrawlerArticles();
    // await this.handleCleanupOldPosts();
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

      const googleResulted = await this.googleIndexRequestRepository.findOne({
        where: { site_id: site.id, post_id: post.id, type: 'URL_UPDATED' },
      });

      if (googleResulted?.response?.urlNotificationMetadata?.url) continue;
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
      relations: [
        'post',
        'post.article',
        'post.article.trending',
        'post.thumbnail',
        'post.categories',
      ],
    });

    if (oldSitePosts.length === 0) {
      this.logger.log('No old posts to delete.');
      return;
    }

    this.logger.log(`Deleting ${oldSitePosts.length} old posts...`);

    for (const sitePost of oldSitePosts) {
      const post_id = sitePost.post_id;

      const post_thumbnail_id = sitePost.post.thumbnail_id;
      const article_id = sitePost.post.article_id;
      const article_thumbnail_id = sitePost.post?.article?.thumbnail_id;

      const trending_id = sitePost.post?.article?.trending_id;

      const trending_thumbnail_id =
        sitePost.post.article?.trending?.thumbnail_id;

      await this.sitePostRepository.delete({ id: sitePost.id });

      await this.categoryRepository
        .createQueryBuilder()
        .delete()
        .from('category_posts')
        .where('post_id = :postId', { postId: sitePost.post_id })
        .execute();

      if (post_id) {
        await this.postRepository.delete({ id: post_id });
      }
      article_id &&
        (await this.trendingArticleRepository.delete({ id: article_id }));

      if (trending_id) {
        await this.trendingRepository.delete({
          id: trending_id,
        });
      }
      if (post_thumbnail_id) {
        await this.removeImage(post_thumbnail_id);
      }

      article_thumbnail_id &&
        (await this.mediaRepository.delete({ id: article_thumbnail_id }));

      trending_thumbnail_id &&
        (await this.mediaRepository.delete({ id: trending_thumbnail_id }));
    }

    const orphanTrending = await this.trendingRepository.find({
      where: { articles: { id: IsNull() } },
      relations: ['articles', 'articles.posts'],
    });
    for (const trending of orphanTrending) {
      await this.trendingRepository.delete({ id: trending.id });
      await this.mediaRepository.delete({ id: trending.thumbnail_id });
    }

    this.logger.debug('END - Cleanup Old Posts.');
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

    const thumbnailUpsert = await this.mediaRepository.upsert(thumbnail, {
      conflictPaths: ['slug'],
    });

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

  private async removeImage(id: string) {
    const image = await this.mediaRepository.findOne({
      where: { id: id },
      select: ['slug', 'id'],
    });
    await this.mediaRepository.delete({ id: id });
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    await fetch(process.env.CDN_API + '/upload', {
      headers: myHeaders,
      method: 'DELETE',
      body: JSON.stringify({ filename: image.slug + '.png' }),
    })
      .then(async (response) => {
        return response.json();
      })
      .then((result) => {
        return console.log(result);
      })
      .catch((error) => {
        return console.log(error);
      });
  }
}
