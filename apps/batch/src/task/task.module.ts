import {
  Media,
  Post,
  Trending,
  TrendingArticle,
  User,
  Notification,
  Category,
  Site,
} from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { TelegramModule } from '@app/modules/telegram/telegram.module';

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
      Site,
      Notification,
    ]),
  ],
  providers: [TaskService],
})
export class TaskModule {}
