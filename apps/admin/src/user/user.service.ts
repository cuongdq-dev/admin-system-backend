import { Category, Post, Site, User } from '@app/entities';
import { MediaService } from '@app/modules';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { RegisterDto } from '../auth-email/email.dto';
import { UserUpdateDto } from './user.dto';
import { paginate, PaginateQuery } from 'nestjs-paginate';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private mediaService: MediaService,

    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async create(userCreateDto: RegisterDto | Pick<User, 'is_active'>) {
    const user = User.create({ ...userCreateDto });
    return this.userRepository.save(user);
  }

  async findMe(user: User) {
    const [profile, sites, categories, posts] = await Promise.all([
      this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.avatar', 'avatar')
        .where('user.id = :userId', { userId: user.id })
        .select([
          'user.id',
          'user.name',
          'user.email',
          'user.is_active',
          'user.created_at',
          'user.updated_at',
          'avatar.id',
          'avatar.url',
          'avatar.filename',
        ])
        .groupBy('user.id')
        .addGroupBy('avatar.id')
        .getOne(),
      this.siteRepository
        .createQueryBuilder('site')
        .where('site.created_by = :userId', { userId: user.id })
        .getMany(),

      this.categoryRepository
        .createQueryBuilder('category')
        .where('category.created_by = :userId', { userId: user.id })
        .getMany(),
      this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.thumbnail', 'thumbnail')
        .leftJoinAndSelect('post.categories', 'categories')
        .leftJoinAndSelect('post.sitePosts', 'sitePosts')
        .where('post.created_by = :userId', { userId: user.id })
        .limit(10)
        .getMany(),
    ]);

    return { ...profile, sites, categories, posts };
  }

  async update(
    user: User,
    avatar: Express.Multer.File,
    updateDto: UserUpdateDto,
  ) {
    const updateData: Record<string, string> = {
      ...updateDto,
    };
    const previousImage = user.avatar_id;
    if (avatar) {
      updateData.avatar_id = (await this.mediaService.update(avatar)).id;
    }

    await this.userRepository.update(user.id, updateData);
    if (avatar && previousImage && updateData.avatar_id !== previousImage) {
      await this.mediaService.deleteMedia(previousImage);
    }

    return plainToInstance(User, {
      ...user,
      ...updateData,
    });
  }

  async getPostByUser(query: PaginateQuery & Record<string, any>, user: User) {
    const postsQb = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.thumbnail', 'thumbnail')
      .leftJoinAndSelect('post.categories', 'categories')
      .leftJoinAndSelect('post.sitePosts', 'sitePosts')
      .leftJoinAndSelect('post.article', 'article')
      .leftJoinAndSelect('sitePosts.site', 'sp_site')
      .leftJoinAndSelect('sitePosts.post', 'sp_post')
      .loadRelationCountAndMap('sitePosts.siteCount', 'post.sitePosts')
      .where('post.created_by = :userId', { userId: user?.id })
      .select([
        'post.id',
        'post.title',
        'post.slug',
        'post.meta_description',
        'post.status',
        'post.created_by',
        'post.created_at',
        'post.article_id',
        'article.id',
        'article.source',
        'article.slug',

        'thumbnail.id',
        'thumbnail.url',
        'thumbnail.slug',

        'categories.id',
        'categories.slug',
        'categories.name',

        'sitePosts.id',
        'sitePosts.created_at',

        'sp_site.id',
        'sp_site.name',
        'sp_site.domain',
        'sp_site.created_at',

        'sp_post.id',
        'sp_post.title',
        'sp_post.slug',
        'sp_post.created_at',
      ])
      .groupBy('post.id')
      .addGroupBy('thumbnail.id')
      .addGroupBy('article.id')
      .addGroupBy('sitePosts.id')
      .addGroupBy('categories.id')
      .addGroupBy('sp_site.id')
      .addGroupBy('sp_post.id');

    console.log(await postsQb.getRawMany());
    if (query?.site_id)
      postsQb.andWhere('sp_site.id = :site_id', { site_id: query.site_id });

    if (query?.status?.length) {
      postsQb.andWhere('post.status IN (:...status)', { status: query.status });
    } else {
      postsQb.andWhere('post.status IN (:...status)', {
        status: ['NEW', 'DRAFT', 'PUBLISHED', 'DELETED'],
      });
    }
    if (query?.categories_id) {
      const categoriesIds = query.categories_id
        .split(',')
        .map((id) => id.trim());
      postsQb.andWhere('categories.id IN (:...categoriesIds)', {
        categoriesIds,
      });
    }

    return paginate({ ...query, filter: { ...query.filter } }, postsQb, {
      sortableColumns: ['created_at'],
      defaultSortBy: [['created_at', 'DESC']],
      maxLimit: 500,
      defaultLimit: 23,
    });
  }
}
