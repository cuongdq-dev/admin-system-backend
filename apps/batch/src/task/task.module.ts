import {
  Category,
  GoogleIndexRequest,
  Media,
  Notification,
  Post,
  Site,
  SitePost,
  Trending,
  TrendingArticle,
  User,
} from '@app/entities';
import { TelegramModule } from '@app/modules/telegram/telegram.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';

@Module({
  imports: [
    TelegramModule,
    TypeOrmModule.forFeature([
      Trending,
      TrendingArticle,
      User,
      Media,
      Category,
      Post,
      SitePost,
      Site,
      Notification,
      GoogleIndexRequest,
    ]),
  ],
  providers: [TaskService],
})
export class TaskModule {}
