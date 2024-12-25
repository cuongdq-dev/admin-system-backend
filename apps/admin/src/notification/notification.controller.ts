import { UserParam } from '@app/decorators';
import { User } from '@app/entities';
import {
  Notification,
  NotificationStatus,
} from '@app/entities/notification.entity';
import { OwnershipGuard } from '@app/guard';
import { IsIDExistPipe } from '@app/pipes';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginationQuery, Paginate, PaginateQuery } from 'nestjs-paginate';
import { NotificationPaginateConfig } from './notification.pagination';
import { NotificationService } from './notification.service';

@ApiTags('notification')
@Controller({ path: 'notification', version: '1' })
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiPaginationQuery({ ...NotificationPaginateConfig })
  getNotifications(
    @UserParam() user: User,
    @Paginate() paginateQuery: PaginateQuery,
  ) {
    console.log(NotificationPaginateConfig);
    return this.notificationService.getNotification(user, paginateQuery);
  }

  @Get(':status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiPaginationQuery({ ...NotificationPaginateConfig })
  getNotificationByStatus(
    @Paginate() paginateQuery: PaginateQuery,
    @Param() { status }: { status: NotificationStatus | 'all' },
    @UserParam() user: User,
  ) {
    return this.notificationService.getListByStatus(
      user,
      paginateQuery,
      status == 'all' ? undefined : status,
    );
  }

  @Patch('/archived/:id')
  @ApiCreatedResponse({ type: Notification })
  @SetMetadata('entity', Notification)
  @SetMetadata('owner_key', 'user_id')
  @UseGuards(OwnershipGuard)
  @UseGuards(AuthGuard('jwt'))
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  archivedNotification(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: Notification }))
    notification: Notification,

    @UserParam() user: User,
  ) {
    return this.notificationService.archivedNotification(notification, user);
  }

  @Patch('/un-archived/:id')
  @ApiCreatedResponse({ type: Notification })
  @SetMetadata('entity', Notification)
  @SetMetadata('owner_key', 'user_id')
  @UseGuards(OwnershipGuard)
  @UseGuards(AuthGuard('jwt'))
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  unarchivedNotification(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: Notification }))
    notification: Notification,

    @UserParam() user: User,
  ) {
    return this.notificationService.unarchivedNotification(notification, user);
  }

  @Patch('/read/:id')
  @ApiCreatedResponse({ type: Notification })
  @SetMetadata('entity', Notification)
  @SetMetadata('owner_key', 'user_id')
  @UseGuards(OwnershipGuard)
  @UseGuards(AuthGuard('jwt'))
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  readNotification(
    @UserParam() user: User,
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: Notification }))
    notification: Notification,
  ) {
    return this.notificationService.readNotification(notification, user);
  }

  @Patch('/read-all')
  @ApiCreatedResponse({ type: Notification })
  @UseGuards(AuthGuard('jwt'))
  readAllNotification(@UserParam() user: User) {
    return this.notificationService.readAllNotification(user);
  }
}
