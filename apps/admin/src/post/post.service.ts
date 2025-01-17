import { Media, Post, Trending, TrendingArticle, User } from '@app/entities';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { postPaginateConfig, trendingPaginateConfig } from './post.pagination';
import {
  fetchTrendings,
  generatePostFromHtml,
  generateSlug,
  saveImageAsBase64,
} from '@app/utils';
import { PostStatus } from '@app/entities/post.entity';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(Media) private mediaRepository: Repository<Media>,
    @InjectRepository(TrendingArticle)
    private trendingArticleRepository: Repository<TrendingArticle>,

    @InjectRepository(Trending)
    private trendingRepository: Repository<Trending>,
  ) {}

  async getAll(query: PaginateQuery) {
    return paginate(
      { ...query, filter: { ...query.filter } },
      this.postRepository,
      postPaginateConfig,
    );
  }

  // ****************************************
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

      const articleSlug = generateSlug(article.url);

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
    const resultPost = await this.postRepository.upsert(
      {
        content: postContent.content,
        title: articleData.title,
        thumbnail_id: articleData.thumbnail_id,
        slug: generateSlug(articleData.title),
        meta_description: postContent.description,
        relatedQueries: postContent.keywords,
        is_published: false,
        article_id: articleId,
      },
      { conflictPaths: ['slug'] },
    );

    return resultPost.generatedMaps[0];
  }

  // ****************************************

  async getPostBySlug(post: Post) {
    return { ...post };
  }
  async fetchContent(index: number, post: Post) {
    const content = await generatePostFromHtml({
      title: post.title,
      url: post.article.url,
      index,
    });
    return { content: content.content };
  }

  async getTrendings() {
    const data = await paginate(
      { path: '' },
      this.trendingRepository,
      trendingPaginateConfig,
    );

    return data.data;
  }

  create(createDto: Post, user: User) {
    return this.postRepository
      .create({ ...createDto, user_id: user.id })
      .save();
  }

  async update(post: Post, updateDto: Post) {
    await this.postRepository.update({ id: post.id }, { ...updateDto });
    if (updateDto.status == PostStatus.DELETED)
      await this.postRepository.softDelete({ id: post.id });

    return { ...post, ...updateDto };
  }

  async delete(post: Post, user: User) {
    if (post.user_id !== user.id) {
      throw new ForbiddenException('You are now allowed to edit this post.');
    }
    await this.postRepository.delete(post.id);
  }
}
