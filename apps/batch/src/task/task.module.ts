import {
  BatchLogs,
  Book,
  Category,
  Chapter,
  GoogleIndexBookRequest,
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
// import { TelegramModule } from '@app/modules/telegram/telegram.module';
import { BatchLogsModule } from '@app/modules/batch-logs/batch-log.module';
import { CrawlModule } from '@app/modules/crawl-data/crawl.module';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskProcessor } from './task.processor';
import { TaskService } from './task.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'task-queue',
    }),

    // TelegramModule,
    BatchLogsModule,
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
      GoogleIndexBookRequest,
      BatchLogs,
      Site,
      Notification,
      GoogleIndexRequest,
    ]),
  ],
  providers: [TaskProcessor, TaskService],
})
export class TaskModule {}
