import {
  Media,
  Post,
  Trending,
  TrendingArticle,
  User,
  Notification,
  Category,
} from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { TelegramModule } from '@app/modules/telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trending,
      TrendingArticle,
      User,
      Media,
      Category,
      Post,
      Notification,
    ]),
    TelegramModule,
  ],
  providers: [TaskService],
})
export class TaskModule {}
