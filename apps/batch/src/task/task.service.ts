import { Media, Post, Trending, TrendingArticle } from '@app/entities';
import {
  fetchTrendings,
  generatePostFromHtml,
  generateSlug,
  saveImageAsBase64,
} from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
  ) {}
  @Cron('*/2 * * * *') // Cứ mỗi 5 phút
  async handleCrawlerArticles() {
    this.logger.debug('START - Crawler Articles.');

    const trendingList = await fetchTrendings();

    for (const trending of trendingList) {
      this.logger.debug(
        `Processing Trending Topic: "${trending.title.query}" | Posts: ${trending?.articles?.length || 0}`,
      );

      const trendingData = await this.processTrending(trending);

      if (trending?.articles?.length) {
        await this.processArticles(trending.articles, trendingData.id);
      }
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
    postContent: any,
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
      is_published: false,
      article_id: articleId,
    });
    const savedPost = await this.postRepository.save(newPost);
    return savedPost;
  }
}