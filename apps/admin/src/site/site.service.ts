import { Category, Post, Site } from '@app/entities';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { In, Repository } from 'typeorm';
import { SiteBodyDto } from './site.dto';
import { postSitePaginateConfig, sitePaginateConfig } from './site.pagination';

@Injectable()
export class SiteService {
  constructor(
    @InjectRepository(Site) private siteRepository: Repository<Site>,
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async getAll(query: PaginateQuery) {
    return paginate(
      { ...query, filter: { ...query.filter } },
      this.siteRepository,
      sitePaginateConfig,
    );
  }
  async getPostBySiteId(
    query: PaginateQuery,
    siteId: string,
    categorySlug: string,
  ) {
    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.sites', 'site')
      .leftJoin('post.categories', 'category') // Không dùng Select ở đây để kiểm soát category
      .leftJoin('post.thumbnail', 'thumbnail') // Không dùng Select ở đây để kiểm soát category
      .leftJoin('category.sites', 'categorySite') // Đảm bảo category chỉ thuộc site đang query
      .where(
        '(site.id = :siteId) AND (categorySite.id = :siteId OR category.id IS NULL)',
        { siteId },
      )

      .select([
        'post.id',
        'post.title',
        'post.meta_description',
        'post.created_at',
        'thumbnail',
        'thumbnail.data',
        'category.id',
        'category.name',
        'post.slug',
        'post.status',
      ])
      .orderBy('post.created_at', 'DESC'); // Thêm sắp xếp nếu cần
    console.log(categorySlug);
    if (categorySlug === 'uncategorized') {
      qb.andWhere('category.id IS NULL'); // Lấy bài viết không có category
    } else if (categorySlug !== 'all') {
      qb.andWhere('category.slug = :categorySlug', { categorySlug });
    }

    return paginate(query, qb, postSitePaginateConfig);
  }

  async getCategoriesBySiteId(siteId: string) {
    // 📌 **Lấy danh sách categories + đếm bài viết thuộc site**
    const categories = await this.categoryRepository
      .createQueryBuilder('categories')
      .leftJoinAndSelect('categories.sites', 'site')
      .leftJoin('categories.posts', 'post')
      .leftJoin('post.sites', 'postSite')
      .where('site.id = :siteId', { siteId })
      .loadRelationCountAndMap(
        'categories.postCount',
        'categories.posts',
        'post',
        (qb) => {
          return qb
            .leftJoin('post.sites', 'filteredSite')
            .where('filteredSite.id = :siteId', { siteId });
        },
      )
      .getMany();

    // 📌 **Tìm bài viết không có category hợp lệ trong site**
    const uncategorizedPostCount = await this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.categories', 'category')
      .leftJoin('post.sites', 'site')
      .leftJoin('category.sites', 'categorySite')
      .where(
        '(site.id = :siteId) AND (categorySite.id = :siteId OR category.id IS NULL)',
        { siteId },
      )
      .andWhere(
        `NOT EXISTS (
        SELECT 1 FROM site_categories sc
        WHERE sc.category_id = category.id AND sc.site_id = :siteId
      )`,
        { siteId },
      ) // Loại trừ bài viết có ít nhất 1 category thuộc site
      .getCount();

    categories.forEach((category: any) => {
      if (!category.postCount) category.postCount = 0;
    });

    if (uncategorizedPostCount > 0) {
      categories.unshift({
        id: 'uncategorized',
        name: 'Other',
        postCount: uncategorizedPostCount,
      } as any);
    }

    return categories.sort((a: any, b: any) => b.postCount - a.postCount);
  }

  async getById(site: Site) {
    return site;
  }

  async create(createDto: SiteBodyDto) {
    const result = await this.siteRepository.create(createDto).save();
    return this.siteRepository.findOne({
      where: { id: result.id },
      relations: ['posts', 'categories'],
    });
  }

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

  async delete(site: Site) {
    await this.siteRepository.softDelete(site.id);
  }
}
