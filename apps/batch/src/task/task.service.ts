import { Media, Post, Trending, TrendingArticle } from '@app/entities';
import {
  fetchTrendings,
  generatePostFromHtml,
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
  @Cron('*/6 * * * *') // Cứ mỗi 5 phút
  async handleCrawlerArticles() {
    this.logger.debug('START - Crawler Articles.');
    const trendingList = await fetchTrendings();

    for (const trending of trendingList) {
      this.logger.debug(
        `CrawlTrending-${trending.title.query} - Posts: ${trending?.articles?.length || 0}`,
      );

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
        const trendingThumbnailEntity = await saveImageAsBase64(
          'thumbnail trending ' + trending?.title?.query.trim(),
          trending?.title?.query,
          trending.image.imageUrl,
        );
        const trendingThumbnail = await this.mediaRepository.upsert(
          trendingThumbnailEntity,
          { conflictPaths: ['slug'] },
        );
        if (trendingThumbnail?.generatedMaps[0]?.id)
          trendingData['thumbnail_id'] =
            trendingThumbnail?.generatedMaps[0]?.id;

        console.log(
          `SavedTrendingThumbnail -${trendingThumbnail?.generatedMaps[0]?.id} -  ${trendingThumbnailEntity.slug}`,
        );
      }
      const resultTrending = await this.trendingRepository.upsert(
        trendingData,
        { conflictPaths: ['titleQuery'] },
      );

      const savedTrending = resultTrending.generatedMaps[0];

      console.log(savedTrending);
      console.log(
        `SavedTrending ${savedTrending?.id}: ${trendingData.titleQuery}`,
      );

      if (trending?.articles) {
        for (const article of trending.articles) {
          const articleData = {
            title: article.title,
            source: article.source,
            url: article.url,
            trending_id: savedTrending?.id,
          };

          const articleSlug = article.url
            .split('/')
            [article.url.split('/').length - 1].replaceAll('.html', '');

          if (article?.image?.imageUrl) {
            const articleThumbnailEntity = await saveImageAsBase64(
              'thumbnail article ' + articleSlug || article?.title.trim(),
              article?.title,
              article.image.imageUrl,
            );

            const articleThumbnail = await this.mediaRepository.upsert(
              articleThumbnailEntity,
              { conflictPaths: ['slug'] },
            );

            if (articleThumbnail.generatedMaps[0]?.id)
              articleData['thumbnail_id'] =
                articleThumbnail.generatedMaps[0]?.id;

            console.log(
              `SavedArticleThumbnail -${articleThumbnail?.generatedMaps[0]?.id} -  ${articleThumbnailEntity.slug}`,
            );
          }

          if (article.url) {
            const postContent = await generatePostFromHtml({
              title: articleData.title,
              url: articleData.url,
            });

            if (postContent?.content) {
              const resultArticle = await this.trendingArticleRepository.upsert(
                {
                  ...articleData,
                  meta_description: postContent?.description,
                  relatedQueries: postContent?.keywords,
                  slug: articleData.title
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim(),
                },
                { conflictPaths: ['url', 'title'] },
              );

              const savedArticle = resultArticle.generatedMaps[0];

              console.log(
                `SavedArticle -${savedArticle?.id} -  ${articleData.title}`,
              );
              const savedPost = await this.postRepository.upsert(
                {
                  content: postContent.content,
                  title: articleData.title,
                  thumbnail_id: articleData['thumbnail_id'],
                  slug: articleData.title
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim(),
                  meta_description: postContent.description,
                  relatedQueries: postContent.keywords,
                  is_published: false,
                  article_id: savedArticle?.id,
                },
                { conflictPaths: ['slug'] },
              );

              console.log(
                `Saved POST -${savedPost?.generatedMaps[0]?.id} - content=${!!postContent.content};description=${postContent.description};keyword=${postContent.keywords}`,
              );
            }
          }
        }
      }
    }
    this.logger.debug('END - Crawler Articles.');
  }
}
