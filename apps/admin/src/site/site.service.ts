import { Category, Post, Site } from '@app/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
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

  async getPostBySiteId(query: PaginateQuery, siteId: string) {
    return paginate(
      { ...query, filter: { ...query.filter } },
      this.postRepository,
      {
        ...postSitePaginateConfig,
        where: { ...postSitePaginateConfig.where, sites: { id: siteId } },
      },
    );
  }
  async getCategoriesBySiteId(siteId: string) {
    // 📌 **Đếm bài viết không có category nhưng thuộc site**
    const uncategorizedPostCount = await this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.categories', 'category')
      .leftJoin('post.sites', 'site')
      .where('site.id = :siteId', { siteId })
      .andWhere('category.id IS NULL')
      .getCount();

    // 📌 **Lấy danh sách categories + đếm bài viết trong site**
    const categories = await this.categoryRepository
      .createQueryBuilder('categories')
      .leftJoinAndSelect('categories.sites', 'site') // Lấy danh sách sites của category
      .leftJoin('categories.posts', 'post') // Join để đếm số bài viết
      .leftJoin('post.sites', 'postSite') // Kiểm tra site của bài viết
      .where('site.id = :siteId', { siteId }) // Chỉ lấy categories thuộc site hiện tại
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

    // 📌 **Đảm bảo tất cả categories có postCount, nếu không thì gán 0**
    categories.forEach((category: any) => {
      if (!category.postCount) category.postCount = 0;
    });

    // 📌 **Thêm "Other" nếu có bài viết chưa có category**
    if (uncategorizedPostCount > 0) {
      categories.unshift({
        id: 'uncategorized',
        name: 'Other',
        postCount: uncategorizedPostCount,
      } as any);
    }

    // 📌 **Sắp xếp theo postCount (giảm dần)**
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

  async update(site: Site, updateDto: SiteBodyDto) {
    await this.siteRepository.update({ id: site.id }, updateDto);
    return this.siteRepository.findOne({
      where: { id: site.id },
      relations: ['posts', 'categories'],
    });
  }

  async delete(site: Site) {
    await this.siteRepository.softDelete(site.id);
  }
}
