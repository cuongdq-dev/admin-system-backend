import {
  Book,
  Category,
  Chapter,
  GoogleIndexRequest,
  Media,
  Notification,
  Post,
  Site,
  SiteBook,
  SitePost,
  Trending,
  TrendingArticle,
  User,
} from '@app/entities';
import { TelegramModule } from '@app/modules/telegram/telegram.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { CrawlModule } from '@app/modules/crawl-data/crawl.module';
import { BullModule } from '@nestjs/bull';
import { TaskProcessor } from './task.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'task-queue',
    }),

    TelegramModule,
    CrawlModule,
    TypeOrmModule.forFeature([
      Trending,
      TrendingArticle,
      User,
      Media,
      Category,
      SiteBook,
      Post,
      Book,
      Chapter,
      SitePost,
      Site,
      Notification,
      GoogleIndexRequest,
    ]),
  ],
  providers: [TaskProcessor, TaskService],
})
export class TaskModule {}
