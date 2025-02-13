import {
  Category,
  Media,
  Notification,
  Post,
  Trending,
  TrendingArticle,
  User,
} from '@app/entities';
import {
  NotificationStatus,
  NotificationType,
} from '@app/entities/notification.entity';
import { PostStatus } from '@app/entities/post.entity';
import {
  fetchTrendings,
  generatePostFromHtml,
  generateSlug,
  saveImageAsBase64,
} from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { pipeline } from '@xenova/transformers';
import * as FirebaseAdmin from 'firebase-admin';
import { IsNull, Not, Repository } from 'typeorm';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Trending)
    private readonly trendingRepository: Repository<Trending>,
    @InjectRepository(TrendingArticle)
    private readonly trendingArticleRepository: Repository<TrendingArticle>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async onModuleInit() {
    console.log('✅ Module initialized, starting crawler...');
    await this.handleUpdateCategory();
  }

  // @Cron('*/10 * * * *')
  async handleUpdateCategory() {
    this.logger.debug('START - Update Category - POST Public.');
    const posts = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.categories', 'category')
      .select([
        'post.id',
        'post.meta_description',
        'post.title',
        'post.relatedQueries',
      ])
      .where('post.status = :status', { status: PostStatus.PUBLISHED })
      .andWhere('category.id IS NULL')
      .getMany();

    const categories = await this.categoryRepository.find();
    const categoryDescription = categories.map(
      (category) => `${category.description}`,
    );
    if (posts.length > 0) {
      for (const post of posts) {
        try {
          const keyword = post.relatedQueries
            .map((keyword) => keyword.query)
            .join(', ');

          const detail_EL = await this.translateText(
            `${keyword}. ${post.title}. ${post.meta_description}`,
          );
          console.log('ss', detail_EL);

          // const payload = {
          //   inputs: detail_EL,
          //   parameters: {
          //     candidate_labels: categoryDescription,
          //   },
          // };

          // console.log('Fetching', post.id);

          // const response = await fetch(
          // );
          // const result = await response.json();
          // if (result && result.labels && result.labels.length) {
          //   const catString = result.labels[0];

          //   const categoryObject = categories.find(
          //     (cat) => cat.description == catString,
          //   );

          //   await this.postRepository.save({
          //     ...post,
          //     categories: [categoryObject],
          //   });
          //   console.log('Updated', post.id, result);
          // } else {
          //   console.log('Updated false', post.id, result);
          // }
        } catch (error) {
          console.error(
            `❌ Lỗi khi cập nhật category cho bài viết ID: ${post.id}`,
            error,
          );
        }
      }
    }

    this.logger.debug('END - Update Category - POST Public.');
  }

  async translateText(text: string) {
    try {
      const myHeaders = new Headers();
      myHeaders.append('accept', '*/*');
      myHeaders.append(
        'accept-language',
        'en,vi;q=0.9,en-US;q=0.8,vi-VN;q=0.7',
      );
      myHeaders.append('origin', 'https://libretranslate.com');
      myHeaders.append('priority', 'u=1, i');
      myHeaders.append(
        'referer',
        'https://libretranslate.com/?source=auto&target=en&q=ch%C3%A0o+c%C3%A1c+b%E1%BA%A1n%0A',
      );
      myHeaders.append(
        'sec-ch-ua',
        '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
      );
      myHeaders.append('sec-ch-ua-mobile', '?0');
      myHeaders.append('sec-ch-ua-platform', '"macOS"');
      myHeaders.append('sec-fetch-dest', 'empty');
      myHeaders.append('sec-fetch-mode', 'cors');
      myHeaders.append('sec-fetch-site', 'same-origin');
      myHeaders.append(
        'user-agent',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      );
      myHeaders.append(
        'Cookie',
        'session=1c474b2d-429d-4d5a-b9fe-c93c6f2149bd',
      );

      const formdata = new FormData();
      formdata.append('q', text);
      formdata.append('source', 'vi');
      formdata.append('target', 'en');
      formdata.append('format', 'text');
      formdata.append('alternatives', '0');
      formdata.append('api_key', '');
      formdata.append('secret', 'VAURG8O');

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: formdata,
        redirect: 'follow',
      };

      const url = 'https://libretranslate.com/translate';
      const response = await fetch(url, requestOptions as any)
        .then((response) => response.text())
        .then((result) => {
          console.log(result);
          return result;
        })
        .catch((error) => {
          return undefined;
        });

      return response?.translatedText || '';
    } catch (error) {
      console.error('Translation failed:', error);
    }
  }

  @Cron('*/10 * * * *')
  async handleCrawlerArticles() {
    this.logger.debug('START - Crawler Articles.');

    const trendingList = await fetchTrendings();
    const admins = await this.userRepository.find({
      where: { firebase_token: Not(IsNull()) },
    });
    const tokens = admins
      .map((admin) => admin.firebase_token)
      .filter((token) => token);

    for (const trending of trendingList) {
      this.logger.debug(
        `Processing Trending Topic: "${trending.title.query}" | Posts: ${trending?.articles?.length || 0}`,
      );

      const trendingData = await this.processTrending(trending);

      if (trending?.articles?.length) {
        await this.processArticles(trending.articles, trendingData.id);
      }
    }

    // Save notifications to the database
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
    if (tokens && Number(tokens?.length) > 0)
      await FirebaseAdmin.messaging().sendEachForMulticast({
        tokens,
        webpush: {
          notification: {
            title: 'New Posts Available',
            body: 'Please check them out!',
          },
        },
      });

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
      const thumbnailId = await this.saveThumbnail(
        trending.image.imageUrl,
        `thumbnail trending ${trending.title.query}`,
        trending.title.query,
      );
      trendingData.thumbnail_id = thumbnailId;

      this.logger.debug(
        `Trending Thumbnail Saved | ID: ${thumbnailId} | Query: "${trending.title.query}"`,
      );
    }

    const resultTrending = await this.trendingRepository.upsert(trendingData, {
      conflictPaths: ['titleQuery'],
    });

    const savedTrending = resultTrending.generatedMaps[0];

    this.logger.debug(
      `Trending Data Saved | ID: ${savedTrending?.id} | Query: "${trending.title.query}"`,
    );

    return savedTrending;
  }

  private async processArticles(articles: any[], trendingId: string) {
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
        const thumbnailId = await this.saveThumbnail(
          article.image.imageUrl,
          `thumbnail article ${articleSlug}`,
          article.title,
        );
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
          );

          this.logger.debug(
            `Post Saved | ID: ${savedPost.id} | Content Length: ${postContent.content.length} | Description: "${postContent.description}"`,
          );
        }
      }
    }
  }

  private async saveThumbnail(imageUrl: string, name: string, query: string) {
    const thumbnailEntity = await saveImageAsBase64(name, query, imageUrl);
    const thumbnail = await this.mediaRepository.upsert(thumbnailEntity, {
      conflictPaths: ['slug'],
    });

    return thumbnail.generatedMaps[0]?.id;
  }

  private async saveArticle(articleData: any, postContent: any) {
    const resultArticle = await this.trendingArticleRepository.upsert(
      {
        ...articleData,
        meta_description: postContent.description,
        relatedQueries: postContent.keywords,
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
  ) {
    const slug = generateSlug(articleData.title);

    const existingPost = await this.postRepository.findOne({
      where: { slug, article_id: articleId },
    });

    if (existingPost) return existingPost;

    const newPost = this.postRepository.create({
      content: postContent.content,
      title: articleData.title,
      thumbnail_id: articleData.thumbnail_id,
      slug,
      meta_description: postContent.description,
      relatedQueries: postContent.keywords,
      status: postContent.contentStatus,
      is_published: false,
      article_id: articleId,
    });
    const savedPost = await this.postRepository.save(newPost);
    return savedPost;
  }
}
