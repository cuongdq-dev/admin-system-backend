import { Category, Post, Site, SitePost, Trending } from '@app/entities';
import { CategoryType } from '@app/entities/category.entity';
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

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async getAnalyticsSite() {
    const [chart, total, recentCount, previousCount] = await Promise.all([
      this.siteRepository
        .createQueryBuilder('site')
        .select("TO_CHAR(site.created_at, 'YYYY-MM-DD')", 'day')
        .addSelect('COUNT(*)', 'total')
        .where("site.created_at >= NOW() - INTERVAL '7 days'")
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany(),

      this.siteRepository.count(),

      this.siteRepository
        .createQueryBuilder('site')
        .where("site.created_at >= NOW() - INTERVAL '7 days'")
        .getCount(),

      this.siteRepository
        .createQueryBuilder('site')
        .where("site.created_at >= NOW() - INTERVAL '14 days'")
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

  async getAnalyticsPosts() {
    const [chart, total, recentCount, previousCount] = await Promise.all([
      this.postRepository
        .createQueryBuilder('post')
        .select("TO_CHAR(post.created_at, 'YYYY-MM-DD')", 'day')
        .addSelect('COUNT(*)', 'total')
        .where("post.created_at >= NOW() - INTERVAL '7 days'")
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany(),

      this.postRepository.count(),

      this.postRepository
        .createQueryBuilder('post')
        .where("post.created_at >= NOW() - INTERVAL '7 days'")
        .getCount(),

      this.postRepository
        .createQueryBuilder('post')
        .where("post.created_at >= NOW() - INTERVAL '14 days'")
        .andWhere("post.created_at < NOW() - INTERVAL '7 days'")
        .getCount(),
    ]);

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
        status: [CategoryType.BOOK],
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
        postStatus: CategoryType.POST,
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

  async getAnalyticsSource() {
    const raw = await this.postRepository
      .createQueryBuilder('post')
      .innerJoin('post.article', 'article')
      .select('article.source', 'source')
      .addSelect('COUNT(*)', 'value')
      .where("post.created_at >= NOW() - INTERVAL '14 days'")
      .groupBy('article.source')
      .orderBy('value', 'DESC')
      .limit(8)
      .getRawMany();

    return {
      chart: {
        categories: raw.map((r) => r.source),
        series: [
          {
            name: 'Số lượng bài viết',
            data: raw.map((r) => parseInt(r.value, 10)),
          },
        ],
      },
    };
  }

  async getAnalyticsGoogleIndexed() {
    const [chart, recentCount, previousCount, total] = await Promise.all([
      this.sitePostRepository
        .createQueryBuilder('sitePost')
        .select("TO_CHAR(sitePost.created_at, 'YYYY-MM-DD')", 'day')
        .addSelect('COUNT(*)', 'total')
        .where("sitePost.created_at >= NOW() - INTERVAL '7 days'")
        .andWhere('sitePost.indexStatus = :indexStatus', {
          indexStatus: IndexStatus.PASS,
        })
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany(),

      this.sitePostRepository
        .createQueryBuilder('sitePost')
        .andWhere("sitePost.created_at >= NOW() - INTERVAL '7 days'")
        .getCount(),

      this.sitePostRepository
        .createQueryBuilder('sitePost')
        .andWhere("sitePost.created_at >= NOW() - INTERVAL '14 days'")
        .andWhere("sitePost.created_at < NOW() - INTERVAL '7 days'")
        .getCount(),
      this.sitePostRepository
        .createQueryBuilder('sitePost')
        .where('sitePost.indexStatus = :indexStatus', {
          indexStatus: IndexStatus.PASS,
        })
        .getCount(),
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
  async getAnalyticsGoogleSearchStatus() {
    const raw = await this.sitePostRepository
      .createQueryBuilder('site_post')
      .select('site_post.indexStatus', 'status')
      .addSelect('COUNT(*)', 'value')
      .groupBy('site_post.indexStatus')
      .getRawMany();

    const chart = {
      series: raw.map((row) => ({
        label: row.status,
        value: parseInt(row.value, 10),
      })),
    };

    return { chart };
  }
}
