import { Category, Post, Site, SitePost, User } from '@app/entities';
// import { TelegramService } from '@app/modules/telegram/telegram.service';
import { workspaceEnum } from '@app/utils/enum';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { DataSource, DeepPartial, In, Repository } from 'typeorm';
import { SiteBodyDto } from './site.dto';
import { sitePaginateConfig } from './site.pagination';

@Injectable()
export class SiteService {
  constructor(
    @InjectRepository(Site) private siteRepository: Repository<Site>,
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(SitePost)
    private sitePostRepository: Repository<SitePost>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    // private readonly telegramService: TelegramService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Lấy danh sách tất cả các site có phân trang
   */
  async getAll(query: PaginateQuery, user: User, workspaces: string) {
    return paginate(query, this.siteRepository, {
      ...sitePaginateConfig,
      where: {
        ...sitePaginateConfig.where,
        created_by: user.id,
        type:
          workspaceEnum[workspaces] == workspaceEnum.wp_system
            ? In([workspaceEnum.wp_books, workspaceEnum.wp_news])
            : workspaceEnum[workspaces],
      },
    });
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
  async create(user: User, body: SiteBodyDto, workspaces: string) {
    const { type, ...createDto } = body;
    const data: DeepPartial<Site> = {
      ...createDto,
      created_by: user.id,
    };

    data.type =
      workspaceEnum[workspaces] != workspaceEnum.wp_system
        ? workspaceEnum[workspaces]
        : type?.id;

    const result = await this.siteRepository
      .create({ ...createDto, ...data })
      .save();

    return this.siteRepository.findOne({
      where: { id: result.id },
      relations: ['categories'],
    });
  }

  /**
   * Kết nối và cập nhật Telegram Bot cho site
   */
  // async getTelegram(token: string, site: Site) {
  //   try {
  //     const data = await this.telegramService.getChatInfo(token);
  //     if (!data || !data.chatId) {
  //       throw new NotFoundException('Not found Telegram BOT.');
  //     }

  //     if (site.teleToken === token && site.teleChatId === data.chatId) {
  //       console.log(
  //         'ℹ️ No changes in Telegram bot details. Skipping message sending.',
  //       );
  //     } else {
  //       const res = await this.telegramService.sendBotAddedNotification(
  //         site.domain,
  //         data.chatId,
  //         token,
  //       );

  //       if (!res.success) {
  //         throw new Error('System error! Please try again later.');
  //       }
  //     }

  //     await this.siteRepository.save({
  //       ...site,
  //       teleBotName: data.botUsername,
  //       teleChatName: data.botName,
  //       teleChatId: data.chatId,
  //       teleToken: token,
  //     });

  //     return data;
  //   } catch (error) {
  //     console.error('🚨 Telegram Integration Error:', error);
  //     throw new Error('System error! Please try again later.');
  //   }
  // }

  /**
   * Cập nhật thông tin site
   */
  async update(site: Site, body: SiteBodyDto, workspaces: string) {
    if (!site) throw new NotFoundException('Site not found.');
    const { type, ...dto } = body;
    const update: DeepPartial<Site> = {
      id: site.id,
      ...dto,
    };

    if (dto?.categories) {
      const categoryIds = dto.categories.map((c) => c.id);
      const newCategories = await this.categoryRepository.findBy({
        id: In(categoryIds),
      });

      update.categories = newCategories;
    }

    if (type) {
      update.type =
        workspaceEnum[workspaces] == workspaceEnum.wp_system
          ? type?.id
          : workspaceEnum[workspaces];
    }

    await this.siteRepository.save(update);

    const resultSite = await this.siteRepository.findOne({
      where: { id: site?.id },
    });

    const resultCategory = await this.getCategoriesBySiteId(site.id);
    return { ...resultSite, categories: resultCategory };
  }

  /**
   * Xóa site (soft delete)
   */
  async delete(site: Site, user: User) {
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(SitePost).delete({ site_id: site.id });
      await manager
        .createQueryBuilder()
        .delete()
        .from('site_categories')
        .where('site_id = :siteId', { siteId: site.id })
        .execute();

      await manager.getRepository(Site).update(site.id, {
        deleted_by: user.id,
      });
      await manager.getRepository(Site).softDelete(site.id);
    });
    return {
      message: 'Site deleted successfully.',
      site,
    };
  }
}
