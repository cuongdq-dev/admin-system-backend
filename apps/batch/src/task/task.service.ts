import {
  Book,
  Category,
  Chapter,
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
import { CategoryType } from '@app/entities/category.entity';
import {
  NotificationStatus,
  NotificationType,
} from '@app/entities/notification.entity';
import { PostStatus } from '@app/entities/post.entity';
import { SiteType } from '@app/entities/site.entity';
import { IndexStatus } from '@app/entities/site_posts.entity';
import { TelegramService } from '@app/modules/telegram/telegram.service';
import {
  extractMetaDescription,
  extractMetaKeywords,
  fetchTrendings,
  fetchWithRetry,
  generatePostFromHtml,
  generateSlug,
  getMetaDataGoogleConsole,
  saveImageAsBase64,
  submitToGoogleIndex,
} from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as cheerio from 'cheerio';
import {
  DataSource,
  In,
  IsNull,
  LessThan,
  MoreThan,
  Not,
  Repository,
} from 'typeorm';

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

    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,

    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,

    @InjectRepository(SitePost)
    private readonly sitePostRepository: Repository<SitePost>,

    @InjectRepository(SiteBook)
    private readonly siteBookRepository: Repository<SiteBook>,

    @InjectRepository(GoogleIndexRequest)
    private readonly googleIndexRequestRepository: Repository<GoogleIndexRequest>,

    private readonly telegramService: TelegramService,

    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    this.logger.log('✅ Module initialized, starting crawler...');
    await this.handleCrawlerBooks();
    await this.handleCrawlerBook();
    // await this.handleCleanupOldPosts();
    // await this.googleIndex();
    // await this.googleMetaData();
  }

  @Cron('0 * * * *')
  async handleCrawlerBooks() {
    this.logger.debug('START - Crawler Books.');
    const result: any[] = [];
    let pageBook = 1;
    const limitBook = 5;
    while (result.length <= limitBook) {
      const url = `https://truyenfull.vision/top-truyen/duoi-100-chuong/trang-${pageBook}/`;
      const response = await fetchWithRetry(url);
      if (!response?.ok) break;

      const html = await response.text();
      const $ = cheerio.load(html);

      const itemsOnPage: any[] = [];
      const elements = $(
        '.list.list-truyen .row[itemtype="https://schema.org/Book"]',
      );
      for (const el of elements) {
        const element = $(el);

        const titleEl = element.find('h3.truyen-title a');
        const title = titleEl.text().trim();

        const checkExist = await this.bookRepository.findOne({
          where: { title: title },
        });
        const link = titleEl.attr('href');

        const full = element.find('.label-title.label-full').length > 0;
        const hot = element.find('.label-title.label-hot').length > 0;
        const isNew = element.find('.label-title.label-new').length > 0;
        const totalChapter = element
          .find('.col-xs-2 a')
          .text()
          .replace(/[^0-9]/g, '')
          .trim();

        if (checkExist) {
          await this.bookRepository.update(
            { id: checkExist.id },
            {
              is_full: full,
              is_hot: hot,
              is_new: isNew,
              total_chapter: parseInt(totalChapter, 10) || 0,
            },
          );
          continue;
        }

        itemsOnPage.push({
          title,
          slug: generateSlug(title),
          source_url: link,
          is_full: full,
          is_hot: hot,
          is_new: isNew,
          total_chapter: parseInt(totalChapter, 10) || 0,
        });
      }

      if (itemsOnPage.length === 0) {
        pageBook++;
        continue;
      }

      result.push(...itemsOnPage);
      if (result.length >= limitBook) {
        result.length = limitBook;
        break;
      }
      pageBook++;
    }

    await this.bookRepository.insert(result);
    this.logger.debug('END - Crawler Books.');
  }
  @Cron('0 */2 * * *')
  async handleCrawlerBook() {
    const books = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.chapters', 'chapter')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from('chapters', 'chapter')
          .where('chapter.book_id = book.id')
          .getQuery();
        return `NOT EXISTS ${subQuery}`;
      })
      .getMany();

    for (const book of books) {
      this.logger.debug('START - Crawler Book: ' + book.title);
      const bookHome = await fetchWithRetry(book.source_url);

      if (bookHome.ok) {
        const bookHtml = await bookHome.text();
        const el = cheerio.load(bookHtml);
        const description = el('.desc-text.desc-text-full').html();
        const meta_description = extractMetaDescription(el);
        const keywords = extractMetaKeywords(el);

        const genreElements = el('div.info h3:contains("Thể loại:")').nextAll(
          'a[itemprop="genre"]',
        );

        const authorName = el('div.info h3:contains("Tác giả:")')
          .parent()
          .find('a[itemprop="author"]')
          .text()
          .trim();

        const categories: Category[] = [];

        const thumbnailUrl = el('.col-xs-12.col-sm-4.col-md-4.info-holder')
          .find('.book img')
          .attr('src');
        const thumbnailData = await saveImageAsBase64(
          'book image ' + book.title,
          'book thumbnail ' + book.title,
          thumbnailUrl,
        );

        const thumbnail = await this.mediaRepository.upsert(
          {
            filename: thumbnailData.filename,
            slug: generateSlug(`thumbnail book ${book.title}`),
            storage_type: StorageType.URL,
            url: thumbnailData.url,
            mimetype: 'url',
            deleted_at: null,
            deleted_by: null,
          },
          {
            conflictPaths: ['slug'],
          },
        );

        for (let i = 0; i < genreElements.length; i++) {
          const genreEl = genreElements[i];
          const name = el(genreEl).text().trim();
          const slug = generateSlug(name);

          await this.categoryRepository.upsert(
            { name, slug, status: CategoryType.BOOK },
            { conflictPaths: ['name', 'slug'] },
          );

          const category = await this.categoryRepository.findOneOrFail({
            where: { name },
          });

          categories.push(category);
        }

        book.description = description;
        book.categories = categories;
        await this.bookRepository.save({
          ...book,
          meta_description,
          keywords,
          author: { name: authorName, slug: generateSlug(authorName) },
          thumbnail_id: thumbnail.generatedMaps[0].id,
        });

        if (book.source_url && Number(book.total_chapter) > 0) {
          for (let index = 1; index <= book.total_chapter; index++) {
            const chapter = book.chapters.find(
              (chapter) => chapter.chapter_number == index,
            );
            if (!chapter || !chapter?.content) {
              const chapterUrl = book.source_url + `chuong-${index}`;
              const response = await fetchWithRetry(chapterUrl);
              if (!response.ok) break;
              const html = await response.text();
              const $ = cheerio.load(html);
              $('[class^="ads-"]').remove();
              $('[class*=" ads-"], [class^="ads-"], [class$=" ads-"]').remove();
              const meta_description =
                $('meta[name="description"]').attr('content') ||
                $('meta[property="og:description"]').attr('content');

              const keywords = $('meta[name="keywords"]')
                .attr('content')
                .split(',')
                .map((keyword) => ({
                  query: keyword.trim(),
                  slug: generateSlug(keyword.trim()),
                }));

              const chapterTitle = $('a.chapter-title').text().trim();
              const chapterContent = $('#chapter-c').html();
              this.logger.debug('START - Crawler Chapter: ' + chapterTitle);

              await this.chapterRepository.insert({
                book_id: book.id,
                chapter_number: index,
                content: chapterContent,
                meta_description: meta_description,
                title: chapterTitle,
                slug: generateSlug(book.title + '-' + chapterTitle),
                keywords: keywords,
                source_url: chapterUrl,
              });
            }
          }

          const autoPostSites = await this.siteRepository.find({
            where: { autoPost: true, type: SiteType.BOOK },
            relations: ['categories'],
            select: ['categories', 'autoPost', 'id', 'domain'],
          });

          for (const site of autoPostSites) {
            await this.siteBookRepository.upsert(
              { site_id: site.id, book_id: book.id },
              { conflictPaths: ['site_id', 'book_id'] },
            );
          }
        }
      }
    }
    this.logger.debug('END - Crawler Book.');
  }

  @Cron('10 */2 * * *')
  async googleIndex() {
    this.logger.debug('START - Request Google Index.');

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
  async googleMetaDataPassed() {
    this.logger.debug('START - Get Google Meta Data.');

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
      this.logger.log(`🔍 Indexing: ${postUrl}`);
    }

    this.logger.debug('END - Get Google Meta Data.');
  }

  @Cron('0 2 * * *')
  async handleCleanupOldPosts() {
    this.logger.debug('START - Cleanup Old Posts.');

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
      this.logger.log('No old posts to delete.');
      return;
    }

    this.logger.log(`Deleting ${oldSitePosts.length} old posts...`);

    for (const [index, sitePost] of oldSitePosts.entries()) {
      try {
        this.logger.debug(
          `Deleting post ${index + 1}/${oldSitePosts.length} - sitePost.id: ${sitePost.id}`,
        );

        const deleted = await this.deletePostArchived(sitePost);

        this.logger.verbose(
          `✔ Deleted post ID ${deleted.deleted?.post?.id ?? 'N/A'} - "${deleted.deleted?.post?.title}"`,
        );
      } catch (err) {
        this.logger.error(
          `❌ Failed to delete sitePost ID ${sitePost.id}: ${err.message}`,
          err.stack,
        );
      }
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

    await this.telegramService.sendMessageWithPost(
      this.chatId,
      this.botToken,
      savedPost,
      categories,
    );

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
