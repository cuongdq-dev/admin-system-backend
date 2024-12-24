import { Lang, Notification, User } from '@app/entities';
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
  ) {}

  async getSetting(user: User) {
    const notifyNew = await this.notificationRepository.count({
      where: { user_id: user.id, status: NotificationStatus.NEW },
    });

    return {
      lang: await this.langRepository.find(),
      user: user,
      notifyNew: notifyNew,
    };
  }
}
