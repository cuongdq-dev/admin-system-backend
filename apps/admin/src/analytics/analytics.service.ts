import {
  Book,
  Category,
  Post,
  Site,
  SiteBook,
  SitePost,
  Trending,
} from '@app/entities';
import { CategoryStatus } from '@app/entities/category.entity';
import { IndexStatus } from '@app/entities/site_posts.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,

    @InjectRepository(Post)
    private postRepository: Repository<Post>,

    @InjectRepository(Trending)
    private trendingRepository: Repository<Trending>,

    @InjectRepository(SitePost)
    private sitePostRepository: Repository<SitePost>,

    @InjectRepository(Book)
    private bookRepository: Repository<Book>,

    @InjectRepository(SiteBook)
    private siteBookRepository: Repository<SiteBook>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async getAnalyticsSite(workspaces: string) {
    const types =
      workspaces === 'wp_books'
        ? ['BOOK']
        : workspaces === 'wp_news'
          ? ['POST']
          : ['BOOK', 'POST'];

    const [chart, total, recentCount, previousCount] = await Promise.all([
      this.siteRepository
        .createQueryBuilder('site')
        .select("TO_CHAR(site.created_at, 'YYYY-MM-DD')", 'day')
        .addSelect('COUNT(*)', 'total')
        .where("site.created_at >= NOW() - INTERVAL '7 days'")
        .andWhere('site.type IN(:...types)', { types: types })
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany(),

      this.siteRepository
        .createQueryBuilder('site')
        .where('site.type IN(:...types)', { types: types })
        .getCount(),

      this.siteRepository
        .createQueryBuilder('site')
        .where("site.created_at >= NOW() - INTERVAL '7 days'")
        .andWhere('site.type IN(:...types)', { types: types })
        .getCount(),

      this.siteRepository
        .createQueryBuilder('site')
        .where("site.created_at >= NOW() - INTERVAL '14 days'")
        .andWhere('site.type IN(:...types)', { types: types })
        .andWhere("site.created_at < NOW() - INTERVAL '7 days'")
        .getCount(),
    ]);

    const diff = recentCount - previousCount;
    const percent =
      previousCount === 0 ? null : Math.round((diff / previousCount) * 100);

    const series = chart.map((value) => value.total);
    const categories = chart.map((value) => value.day);
    return {
      total,
      recentCount,
      previousCount,
      percent,
      chart: { series, categories },
    };
  }

  async analyticContents(workspace: string) {
    const getContentAnalytics = async (
      repo: Repository<any>,
      alias: string,
    ) => {
      const stats7Days = repo
        .createQueryBuilder(alias)
        .select(`TO_CHAR(${alias}.created_at, 'YYYY-MM-DD')`, 'day')
        .addSelect('COUNT(*)', 'total')
        .where(`${alias}.created_at >= NOW() - INTERVAL '7 days'`)
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany();

      const totalCount = repo.count();

      const countThisWeek = repo
        .createQueryBuilder(alias)
        .where(`${alias}.created_at >= NOW() - INTERVAL '7 days'`)
        .getCount();

      const countLastWeek = repo
        .createQueryBuilder(alias)
        .where(`${alias}.created_at >= NOW() - INTERVAL '14 days'`)
        .andWhere(`${alias}.created_at < NOW() - INTERVAL '7 days'`)
        .getCount();

      return Promise.all([
        stats7Days,
        totalCount,
        countThisWeek,
        countLastWeek,
      ]);
    };

    if (workspace === 'wp_books') {
      return getContentAnalytics(this.bookRepository, 'book');
    }

    if (workspace === 'wp_news') {
      return getContentAnalytics(this.postRepository, 'post');
    }

    // default: tổng hợp cả book + post
    const [
      [bookStats, bookTotal, bookThisWeek, bookLastWeek],
      [postStats, postTotal, postThisWeek, postLastWeek],
    ] = await Promise.all([
      getContentAnalytics(this.bookRepository, 'book'),
      getContentAnalytics(this.postRepository, 'post'),
    ]);

    return [
      [...bookStats, ...postStats], // Nếu cần merge theo `day`, có thể xử lý thêm
      bookTotal + postTotal,
      bookThisWeek + postThisWeek,
      bookLastWeek + postLastWeek,
    ] as any;
  }

  async getAnalyticsPosts(workspace: string) {
    const [chart, total, recentCount, previousCount] =
      await this.analyticContents(workspace);

    const diff = recentCount - previousCount;
    const percent =
      previousCount === 0 ? 100 : Math.round((diff / previousCount) * 100);

    const series = chart.map((value) => value.total);
    const categories = chart.map((value) => value.day);
    return {
      total,
      recentCount,
      previousCount,
      percent,
      chart: { series, categories },
    };
  }

  async getAnalyticsCategories() {
    const raw = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.posts', 'post')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .select([
        'category.id AS id',
        'category.name AS name',
        'COUNT(post.id) AS postCount',
      ])
      .orderBy('postCount', 'DESC')
      .getRawMany();
    return {
      chart: {
        categories: raw.map((r) => r.name),
        series: [
          {
            name: 'Số lượng bài viết',
            data: raw.map((r) => parseInt(r.postcount, 10)),
          },
        ],
      },
    };
  }
  async getAnalyticsBookCategories() {
    const raw = await this.categoryRepository
      .createQueryBuilder('category')
      .innerJoin('category.books', 'book')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .andWhere('category.status IN (:...status)', {
        status: [CategoryStatus.BOOK],
      })
      .select([
        'category.id AS id',
        'category.name AS name',
        'COUNT(book.id) AS bookCount',
      ])
      .orderBy('bookCount', 'DESC')
      .limit(20)
      .getRawMany();

    return {
      chart: {
        categories: raw.map((r) => r.name),
        series: [
          {
            name: 'Số lượng truyện, sách',
            data: raw.map((r) => parseInt(r.bookcount, 10)),
          },
        ],
      },
    };
  }
  async getAnalyticsNewsCategories() {
    const raw = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.posts', 'post')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .where('(category.status = :postStatus OR category.status IS NULL)', {
        postStatus: CategoryStatus.POST,
      })
      .select([
        'category.id AS id',
        'category.name AS name',
        'COUNT(post.id) AS postCount',
      ])
      .orderBy('postCount', 'DESC')
      .getRawMany();

    return {
      chart: {
        categories: raw.map((r) => r.name),
        series: [
          {
            name: 'Số lượng bài viết',
            data: raw.map((r) => parseInt(r.postcount, 10)),
          },
        ],
      },
    };
  }

  async getAnalyticsTrendings() {
    const [chart, recentCount, previousCount, total] = await Promise.all([
      this.trendingRepository
        .createQueryBuilder('trending')
        .select("TO_CHAR(trending.created_at, 'YYYY-MM-DD')", 'day')
        .addSelect('COUNT(*)', 'total')
        .where("trending.created_at >= NOW() - INTERVAL '7 days'")
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany(),

      this.trendingRepository
        .createQueryBuilder('trending')
        .andWhere("trending.created_at >= NOW() - INTERVAL '7 days'")
        .getCount(),

      this.trendingRepository
        .createQueryBuilder('trending')
        .andWhere("trending.created_at >= NOW() - INTERVAL '14 days'")
        .andWhere("trending.created_at < NOW() - INTERVAL '7 days'")
        .getCount(),
      this.trendingRepository.count(),
    ]);

    const diff = recentCount - previousCount;
    const percent =
      previousCount === 0 ? 100 : Math.round((diff / previousCount) * 100);

    const series = chart.map((item) => parseInt(item.total));
    const categories = chart.map((item) => item.day);

    return {
      total,
      recentCount,
      previousCount,
      percent,
      chart: { categories, series },
    };
  }

  async analyticsSource(workspace: string) {
    const bookQuery = this.bookRepository
      .createQueryBuilder('book')
      .select(
        `regexp_replace(regexp_replace(book.source_url, '^https?://', ''), '/.*$', '')`,
        'source',
      )
      .addSelect('COUNT(*)', 'value')
      .groupBy('source');

    const newsQuery = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.article', 'article')
      .select('article.source', 'source')
      .addSelect('COUNT(*)', 'value')
      .groupBy('article.source');

    switch (workspace) {
      case 'wp_books':
        return await bookQuery.orderBy('value', 'DESC').limit(15).getRawMany();

      case 'wp_news':
        return await newsQuery.orderBy('value', 'DESC').limit(15).getRawMany();

      default:
        const [bookResult, newsResult] = await Promise.all([
          bookQuery.getRawMany(),
          newsQuery.getRawMany(),
        ]);

        const merged: Record<string, number> = {};

        for (const row of [...bookResult, ...newsResult]) {
          const source = row.source ?? '';
          const value = parseInt(row.value, 10);
          merged[source] = (merged[source] || 0) + value;
        }

        const mergedArray = Object.entries(merged)
          .map(([source, value]) => ({ source, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 15);

        return mergedArray;
    }
  }
  async getAnalyticsSource(workspace: string) {
    const raw = await this.analyticsSource(workspace);
    return {
      chart: {
        categories: raw.map((r) => r.source || 'Other'),
        series: [
          {
            name: 'Số lượng',
            data: raw.map((r) => parseInt(r.value, 10)),
          },
        ],
      },
    };
  }

  async googleIndexed(workspace: string) {
    const getStats = async (repo: Repository<any>) => {
      const [stats, thisWeek, lastWeek, totalIndexed] = await Promise.all([
        repo
          .createQueryBuilder('site')
          .select("TO_CHAR(site.created_at, 'YYYY-MM-DD')", 'day')
          .addSelect('COUNT(*)', 'total')
          .where("site.created_at >= NOW() - INTERVAL '7 days'")
          .andWhere('site.indexStatus = :indexStatus', {
            indexStatus: IndexStatus.PASS,
          })
          .groupBy('day')
          .orderBy('day', 'ASC')
          .getRawMany(),

        repo
          .createQueryBuilder('site')
          .where("site.created_at >= NOW() - INTERVAL '7 days'")
          .getCount(),

        repo
          .createQueryBuilder('site')
          .where("site.created_at >= NOW() - INTERVAL '14 days'")
          .andWhere("site.created_at < NOW() - INTERVAL '7 days'")
          .getCount(),

        repo
          .createQueryBuilder('site')
          .where('site.indexStatus = :indexStatus', {
            indexStatus: IndexStatus.PASS,
          })
          .getCount(),
      ]);

      return { stats, thisWeek, lastWeek, totalIndexed };
    };

    if (workspace === 'wp_books') {
      const { stats, thisWeek, lastWeek, totalIndexed } = await getStats(
        this.siteBookRepository,
      );
      return [stats, thisWeek, lastWeek, totalIndexed];
    }

    if (workspace === 'wp_news') {
      const { stats, thisWeek, lastWeek, totalIndexed } = await getStats(
        this.sitePostRepository,
      );
      return [stats, thisWeek, lastWeek, totalIndexed];
    }

    const [book, post] = await Promise.all([
      getStats(this.siteBookRepository),
      getStats(this.sitePostRepository),
    ]);

    return [
      [...book.stats, ...post.stats],
      book.thisWeek + post.thisWeek,
      book.lastWeek + post.lastWeek,
      book.totalIndexed + post.totalIndexed,
    ] as any;
  }

  async getAnalyticsGoogleIndexed(workspace: string) {
    const [chart, recentCount, previousCount, total] =
      await this.googleIndexed(workspace);

    const diff = recentCount - previousCount;
    const percent =
      previousCount === 0 ? 100 : Math.round((diff / previousCount) * 100);

    const series = chart.map((item) => parseInt(item.total));
    const categories = chart.map((item) => item.day);

    return {
      total,
      recentCount,
      previousCount,
      percent,
      chart: { categories, series },
    };
  }

  async googleSearchStatus(workspace: string) {
    const getStatusStats = (repo: Repository<any>) =>
      repo
        .createQueryBuilder('site')
        .select('site.indexStatus', 'status')
        .addSelect('COUNT(*)', 'value')
        .groupBy('site.indexStatus')
        .getRawMany();

    if (workspace === 'wp_books') {
      return getStatusStats(this.siteBookRepository);
    }

    if (workspace === 'wp_news') {
      return getStatusStats(this.sitePostRepository);
    }

    const [bookStatuses, postStatuses] = await Promise.all([
      getStatusStats(this.siteBookRepository),
      getStatusStats(this.sitePostRepository),
    ]);

    const merged = new Map<string, number>();
    [...bookStatuses, ...postStatuses].forEach(({ status, value }) => {
      merged.set(status, (merged.get(status) || 0) + parseInt(value, 10));
    });

    return Array.from(merged.entries()).map(([status, value]) => ({
      status,
      value,
    }));
  }

  async getAnalyticsGoogleSearchStatus(workspace: string) {
    const raw = await this.googleSearchStatus(workspace);
    const chart = {
      series: raw.map((row) => ({
        label: row.status,
        value: parseInt(row.value, 10),
      })),
    };

    return { chart };
  }
}
