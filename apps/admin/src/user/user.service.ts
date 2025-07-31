import {
  Category,
  Media,
  Post,
  Role,
  Site,
  User,
  UserRole,
} from '@app/entities';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { DataSource, In, Repository } from 'typeorm';
import { MediaService } from '../media/media.service';
import { UserUpdateDto } from './user.dto';
import { userPaginateConfig } from './user.pagination';

@Injectable()
export class UserService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Media)
    private mediaService: MediaService,

    @InjectRepository(Site)
    private siteRepository: Repository<Site>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async getAll(query: PaginateQuery, user: User) {
    return paginate(query, this.userRepository, userPaginateConfig);
  }

  async create(user: User, body: UserUpdateDto) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Lấy các role theo id
      const roles = await manager.find(Role, {
        where: { id: In(body?.roles?.map((r) => r.id)) },
      });

      // 2. Tạo user mới
      const newUser = manager.create(User, {
        ...body,
        created_by: user.id,
      });

      const savedUser = await manager.save(User, newUser);

      // 3. Tạo các bản ghi user_roles
      const userRoles = roles.map((role) =>
        manager.create(UserRole, {
          role: role,
          user: savedUser,
          created_by: user.id,
        }),
      );

      await manager.save(UserRole, userRoles);

      // 4. Trả về kết quả kèm roles (nếu muốn)
      const result = await manager.findOne(User, {
        where: { id: savedUser.id },
        relations: ['user_roles', 'user_roles.role'],
      });

      return result;
    });
  }

  async getDetail(user: User) {
    return user;
  }

  async findMe(user: User) {
    const [profile, sites, categories, posts] = await Promise.all([
      this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.avatar', 'avatar')
        .leftJoinAndSelect('user.banner', 'banner')
        .where('user.id = :userId', { userId: user.id })
        .select([
          'user.id',
          'user.name',
          'user.email',
          'user.address',
          'user.phoneNumber',
          'user.is_active',
          'user.created_at',
          'user.updated_at',

          'avatar.id',
          'avatar.url',
          'avatar.filename',

          'banner.id',
          'banner.url',
          'banner.filename',
        ])
        .groupBy('user.id')
        .addGroupBy('avatar.id')
        .addGroupBy('banner.id')
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

  async update(currentUser: User, input: UserUpdateDto, user: User) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Tìm user cần cập nhật
      const detail = await manager.findOne(User, {
        where: [{ id: currentUser.id }],
      });

      if (!detail) {
        throw new NotFoundException('User not found.');
      }

      // 2. Cập nhật thông tin cơ bản
      detail.name = input.name;
      detail.phoneNumber = input.phoneNumber;
      detail.email = input.email;
      detail.address = input.address;
      detail.is_active = input.is_active;
      detail.updated_by = currentUser.id;

      if (input.password) {
        const salt = await bcrypt.genSalt();
        detail.password = await bcrypt.hash(input.password, salt);
      }

      const roles = await manager.find(Role, {
        where: { id: In(input.roles.map((r) => r.id)) },
      });

      const userRoles = roles.map((role) =>
        manager.create(UserRole, {
          role: role,
          user: currentUser,
          created_by: user.id,
        }),
      );

      await manager.delete(UserRole, { user: detail });

      await manager.save(UserRole, userRoles);

      // 4. Lưu lại thông tin user
      await manager.save(User, detail);

      // 5. Trả về user kèm roles mới
      const result = await manager.findOne(User, {
        where: { id: detail.id },
        relations: [
          'user_roles',
          'user_roles.role',
          'user_roles.role.role_permissions',
          'user_roles.role.role_permissions.permission',
        ],
      });

      return result;
    });
  }

  /**
   * Xóa site (soft delete)
   */
  async delete(user: User) {
    await this.userRepository.delete({ id: user.id });
    return {
      message: 'User deleted successfully.',
    };
  }

  async updateProfile(user: User, updateDto: UserUpdateDto) {
    const findUser = await this.userRepository.findOne({
      where: [{ id: user.id }, { created_by: user.id }],
      select: [
        'id',
        'name',
        'email',
        'phoneNumber',
        'address',
        'is_active',
        'created_at',
        'updated_at',
      ],
    });

    if (!findUser) throw new NotFoundException('User not found.');

    await this.userRepository.update({ id: findUser.id }, updateDto);

    return { ...findUser, ...updateDto };
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

  async uploadBanner(user: User, file: Express.Multer.File) {
    const findUser = await this.userRepository.findOne({
      where: [{ id: user.id }, { created_by: user.id }],
      select: [
        'id',
        'name',
        'email',
        'address',
        'phoneNumber',
        'is_active',
        'created_at',
        'updated_at',
      ],
    });

    if (!findUser) throw new NotFoundException('User not found.');
    const media = await this.mediaService.uploadMedia(file, user);
    if (media.id) {
      await this.userRepository.update(
        { id: findUser.id },
        { banner_id: media.id },
      );
      return { ...user, banner: media };
    }
  }

  async uploadAvatar(user: User, file: Express.Multer.File) {
    const findUser = await this.userRepository.findOne({
      where: [{ id: user.id }, { created_by: user.id }],
      select: [
        'id',
        'name',
        'email',
        'address',
        'phoneNumber',
        'is_active',
        'created_at',
        'updated_at',
      ],
    });
    if (!findUser) throw new NotFoundException('User not found.');
    const media = await this.mediaService.uploadMedia(file, user);
    if (media.id) {
      await this.userRepository.update(
        { id: findUser.id },
        { avatar_id: media.id },
      );
      return { ...user, avatar: media };
    }
  }
}
