import {
  Category,
  Lang,
  Notification,
  Post as PostEntity,
  Site,
  User,
} from '@app/entities';
import { NotificationStatus } from '@app/entities/notification.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,

    @InjectRepository(Lang)
    private langRepository: Repository<Lang>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Site)
    private siteRepository: Repository<Site>,

    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async getSetting(user: User) {
    const [notifyNew, lang, u, sites, posts, categories] = await Promise.all([
      this.notificationRepository.count({
        where: { user_id: user.id, status: NotificationStatus.NEW },
      }),
      this.langRepository.find(),
      this.userRepository.findOne({
        where: { id: user.id },
        relations: ['avatar'],
      }),

      this.siteRepository
        .createQueryBuilder('site')
        .where('site.created_by = :createdBy', { createdBy: user.id })
        .select(['site.id AS id', 'site.name AS title'])
        .getRawMany(),
      this.postRepository
        .createQueryBuilder('post')
        .select(['post.id AS id', 'post.title AS title'])
        .getRawMany(),
      this.categoryRepository
        .createQueryBuilder('category')
        .where('category.created_by = :createdBy', { createdBy: user.id })
        .select(['category.id AS id', 'category.name AS title'])
        .getRawMany(),
    ]);
    return {
      lang,
      user: u,
      notifyNew,
      dropdown: { sites, posts, categories },
    };
  }

  async setFirebaseToken(token: string, user: User) {
    return await this.userRepository.update(
      { id: user.id },
      { firebase_token: token },
    );
  }
}
