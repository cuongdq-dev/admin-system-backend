import { Notification, User } from '@app/entities';
import { NotificationStatus } from '@app/entities/notification.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { NotificationPaginateConfig } from './notification.pagination';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async getNotification(user: User, query: PaginateQuery) {
    const listNew = await this.getListByStatus(
      user,
      { ...query, path: query.path + '/new' },
      NotificationStatus.NEW,
    );

    const listArchived = await this.getListByStatus(
      user,
      { ...query, path: query.path + '/archived' },
      NotificationStatus.ARCHIVED,
    );

    const listAll = await this.getListByStatus(user, {
      ...query,
      path: query.path + '/all',
    });

    return { new: listNew, archived: listArchived, all: listAll };
  }

  async getListByStatus(
    user: User,
    query: PaginateQuery,
    status?: NotificationStatus,
  ) {
    return paginate(query, this.notificationRepository, {
      ...NotificationPaginateConfig,
      ...(status == NotificationStatus.ARCHIVED && {
        sortableColumns: ['updated_at'],
        defaultSortBy: [['updated_at', 'DESC']],
      }),
      where: {
        user_id: user.id,
        status: status
          ? status
          : In([NotificationStatus.NEW, NotificationStatus.READED]),
      },
    });
  }

  async archivedNotification(notification: Notification, user: User) {
    await this.notificationRepository.update(notification.id, {
      status: NotificationStatus.ARCHIVED,
      updated_by: user.id,
    });
    return await this.notificationRepository.findOne({
      where: { id: notification.id },
    });
  }
  async unarchivedNotification(notification: Notification, user: User) {
    await this.notificationRepository.update(notification.id, {
      status: NotificationStatus.READED,
      updated_by: user.id,
    });
    return await this.notificationRepository.findOne({
      where: { id: notification.id },
    });
  }

  async readNotification(notification: Notification, user: User) {
    await this.notificationRepository.update(
      {
        id: notification.id,
        status: NotificationStatus.NEW,
        user_id: user.id,
      },
      { status: NotificationStatus.READED, updated_by: user.id },
    );
    return await this.notificationRepository.findOne({
      where: { id: notification.id },
    });
  }

  async readAllNotification(user: User) {
    const now = new Date();

    await this.notificationRepository.update(
      {
        status: NotificationStatus.NEW,
        user_id: user.id,
        created_at: LessThanOrEqual(now),
      },
      { status: NotificationStatus.READED, updated_by: user.id },
    );
    return true;
  }
}
