import {
  Book,
  Category,
  Notification,
  Post as PostEntity,
  Role,
  Site,
  User,
} from '@app/entities';
import { NotificationStatus } from '@app/entities/notification.entity';
import { UserPermissions } from '@app/entities/user_permissions.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(UserPermissions)
    private permissionRepository: Repository<UserPermissions>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Site)
    private siteRepository: Repository<Site>,

    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,

    @InjectRepository(Book)
    private bookRepository: Repository<Book>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async getSetting(user: User, workspaces: string) {
    const types =
      workspaces === 'wp_books'
        ? ['BOOK']
        : workspaces === 'wp_news'
          ? ['POST']
          : ['BOOK', 'POST'];

    const [notifyNew, u, sites, posts, books, categories, roles, permissions] =
      await Promise.all([
        this.notificationRepository.count({
          where: { user_id: user.id, status: NotificationStatus.NEW },
        }),
        this.userRepository.findOne({
          where: { id: user.id },
          relations: ['avatar'],
        }),
        this.siteRepository
          .createQueryBuilder('site')
          .where('site.created_by = :createdBy', { createdBy: user.id })
          .andWhere('site.type IN(:...types)', { types: types })
          .select(['site.id AS id', 'site.name AS title'])
          .getRawMany(),
        this.postRepository
          .createQueryBuilder('post')
          .select(['post.id AS id', 'post.title AS title'])
          .getRawMany(),
        this.bookRepository
          .createQueryBuilder('book')
          .select(['book.id AS id', 'book.title AS title'])
          .getRawMany(),

        this.categoryRepository
          .createQueryBuilder('category')
          .leftJoinAndSelect('category.sites', 'site')
          .andWhere('category.status IN(:...types)', { types: types })
          .select([
            'category.id AS id',
            'category.name AS title',
            'category.status AS type',
          ])
          .getRawMany(),
        this.roleRepository
          .createQueryBuilder('roles')
          .leftJoinAndSelect('roles.permissions', 'permissions')
          .getMany(),
        this.permissionRepository.createQueryBuilder('permissions').getMany(),
      ]);

    const permissionsArr = Object.values(
      permissions.reduce(
        (acc, { subject, action, id }) => {
          if (!acc[subject]) {
            acc[subject] = { name: subject, permissions: [] };
          }
          acc[subject].permissions.push({ action, id });
          return acc;
        },
        {} as Record<
          string,
          { name: string; permissions: { action: string; id: string }[] }
        >,
      ),
    );

    return {
      lang: [
        { code: 'vn', name: 'Việt Nam' },
        { code: 'en', name: 'English' },
      ],
      user: u,
      notifyNew,
      dropdown: { sites, posts, books, categories },
      collectionPermission: permissionsArr,
      roles: roles,
    };
  }

  async setFirebaseToken(token: string, user: User) {
    return await this.userRepository.update(
      { id: user.id },
      { firebase_token: token },
    );
  }
}
