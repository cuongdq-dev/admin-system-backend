import { Category, Post, Site, SitePost } from '@app/entities';
import { TelegramService } from '@app/modules/telegram/telegram.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { In, Repository } from 'typeorm';
import { SiteBodyDto } from './site.dto';
import { sitePaginateConfig, sitePostsPaginateConfig } from './site.pagination';

@Injectable()
export class SiteService {
  constructor(
    @InjectRepository(Site) private siteRepository: Repository<Site>,
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(SitePost)
    private sitePostRepository: Repository<SitePost>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private readonly telegramService: TelegramService,
  ) {}

  /**
   * Lấy danh sách tất cả các site có phân trang
   */
  async getAll(query: PaginateQuery) {
    return paginate(
      { ...query, filter: { ...query.filter } },
      this.siteRepository,
      sitePaginateConfig,
    );
  }

  /**
   * Lấy danh sách bài viết của site dựa trên siteId
   */
  async getPostBySiteId(
    query: PaginateQuery,
    siteId: string,
    categorySlug: string,
  ) {
    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.sitePosts', 'sitePost')
      .leftJoinAndSelect('post.thumbnail', 'thumbnail')
      .leftJoinAndSelect('post.categories', 'category')
      .where('sitePost.site_id = :siteId', { siteId });

    // 🟠 Lọc theo category nếu có categorySlug
    if (categorySlug && categorySlug !== 'all') {
      if (categorySlug === 'uncategorized') {
        qb.andWhere('category.id IS NULL'); // Lọc bài viết không có category
      } else {
        qb.andWhere('category.slug = :categorySlug', { categorySlug });
      }
    }

    return paginate(query, qb, {
      sortableColumns: ['created_at'],
      defaultSortBy: [['created_at', 'DESC']],
      maxLimit: 50,
      defaultLimit: 23,
      select: [
        'post.id',
        'post.slug',
        'post.title',
        'post.status',
        'post.meta_description',
        'post.created_at',
        'thumbnail.id',
        'thumbnail.data',
        'category.id',
        'category.name',
      ],
    });
  }

  /**
   * Lấy danh sách danh mục của site
   */
  async getCategoriesBySiteId(siteId: string) {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.posts', 'post')
      .leftJoin('category.sites', 'site')
      .where('site.id = :siteId', { siteId })
      .loadRelationCountAndMap(
        'category.postCount',
        'category.posts',
        'post',
        (qb) =>
          qb
            .innerJoin('post.sitePosts', 'sp')
            .where('sp.site_id = :siteId', { siteId }),
      )
      .getMany();

    // 🟠 2. Đếm số bài viết **không có category nào**
    const uncategorizedPostCount = await this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.categories', 'category')
      .leftJoin('post.sitePosts', 'sp')
      .where('sp.site_id = :siteId', { siteId })
      .andWhere('category.id IS NULL') // Lọc bài viết không có category
      .getCount();

    // 🔵 3. Nếu có bài viết uncategorized, thêm vào danh sách categories
    if (uncategorizedPostCount > 0) {
      categories.unshift({
        id: 'uncategorized',
        slug: 'uncategorized',
        name: 'Chưa phân loại',
        postCount: uncategorizedPostCount,
      } as any);
    }

    // 🏆 4. Trả về danh sách categories, sắp xếp theo số lượng bài viết
    return categories.sort((a: any, b: any) => b.postCount - a.postCount);
  }

  /**
   * Lấy thông tin chi tiết của site
   */
  async getById(site: Site) {
    return site;
  }

  /**
   * Tạo site mới
   */
  async create(createDto: SiteBodyDto) {
    const result = await this.siteRepository.create(createDto).save();
    return this.siteRepository.findOne({
      where: { id: result.id },
      relations: ['categories'],
    });
  }

  /**
   * Kết nối và cập nhật Telegram Bot cho site
   */
  async getTelegram(token: string, site: Site) {
    try {
      const data = await this.telegramService.getChatInfo(token);
      if (!data || !data.chatId) {
        throw new NotFoundException('Not found Telegram BOT.');
      }

      if (site.teleToken === token && site.teleChatId === data.chatId) {
        console.log(
          'ℹ️ No changes in Telegram bot details. Skipping message sending.',
        );
      } else {
        const res = await this.telegramService.sendBotAddedNotification(
          site.domain,
          data.chatId,
          token,
        );

        if (!res.success) {
          throw new Error('System error! Please try again later.');
        }
      }

      await this.siteRepository.save({
        ...site,
        teleBotName: data.botUsername,
        teleChatName: data.botName,
        teleChatId: data.chatId,
        teleToken: token,
      });

      return data;
    } catch (error) {
      console.error('🚨 Telegram Integration Error:', error);
      throw new Error('System error! Please try again later.');
    }
  }

  /**
   * Get Site Indexing
   */
  async getSiteIndexing(
    id: string,
    paginateQuery: PaginateQuery,
    query: { indexStatus?: string[] },
  ) {
    const indexStatuses = Array.isArray(query?.indexStatus)
      ? query?.indexStatus
      : query?.indexStatus
        ? [query?.indexStatus]
        : undefined; // Nếu không có giá trị, đặt undefined
    console.log(indexStatuses);
    const data = await paginate(paginateQuery, this.sitePostRepository, {
      ...sitePostsPaginateConfig,
      where: {
        ...sitePostsPaginateConfig.where,
        site_id: id,
        ...(indexStatuses && { indexStatus: In(indexStatuses) }),
      },
    });

    return {
      ...data,
      data: data.data.map((d) => {
        return {
          site_id: d.site.id,
          site_name: d.site.name,
          site_domain: d.site.domain,
          post_slug: d.post.slug,
          post_title: d.post.title,
          post_id: d.post.id,
          indexStatus: d.indexStatus,
          created_at: d.created_at,
          updated_at: d.updated_at,
        };
      }),
    };
  }

  /**
   * Cập nhật thông tin site
   */
  async update(site: Site, dto: SiteBodyDto) {
    if (!site) throw new NotFoundException('Site not found.');

    if (dto?.categories) {
      const categoryIds = dto.categories.map((c) => c.id);
      const newCategories = await this.categoryRepository.findBy({
        id: In(categoryIds),
      });

      dto.categories = newCategories;
    }

    if (dto?.posts) {
      const postIds = dto.posts.map((p) => p.id);
      const newPosts = await this.postRepository.findBy({ id: In(postIds) });
      dto.posts = newPosts;
    }

    const resultSite = await this.siteRepository.save({ id: site.id, ...dto });
    const resultCategory = await this.getCategoriesBySiteId(site.id);
    return { ...resultSite, categories: resultCategory };
  }

  /**
   * Xóa site (soft delete)
   */
  async delete(site: Site) {
    await this.siteRepository.softDelete(site.id);
  }
}
