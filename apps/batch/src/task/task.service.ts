import { BatchLogs } from '@app/entities';
import { BatchLogsService } from '@app/modules/batch-logs/batch-log.service';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { TaskJobName } from './task.dto';

export const CustomCron = {
  CRON_6_HOUR: '0 6 * * *', //6:00 AM hằng ngày	✅ OK
  CRON_8_HOUR: '0 8 * * *', // 8:00 AM hằng ngày	✅ OK
  CRON_1_HOUR_10_MINUTE: '10 1 * * *', //1:10 AM hằng ngày	✅ OK
  CRON_EVERY_4_HOUR_30_MINUTE: '30 1,5,9,13,17,21 * * *', //Mỗi 4h tại các mốc lẻ	✅ OK
  CRON_EVERY_5_HOUR_45_MINUTE: '45 4,9,14,19 * * *', //Mỗi 5h từ 4:45 AM	✅ OK
  CRON_EVERY_12_HOUR_30_MINUTE: '30 0 * * *', //12:30 AM hằng ngày	✅ OK
  CRON_4_HOUR_10_MINUTE: '10 4 * * *', //4:10 AM	✅ OK
  CRON_EVERY_3_HOUR_45_MINUTE: '45 2,6,10,14,18,22 * * *', //Mỗi 3h lệch	✅ OK
};

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  constructor(
    @InjectQueue('task-queue') private taskQueue: Queue,

    private readonly batchLogsService: BatchLogsService,
  ) {}

  async onModuleInit() {
    this.logger.log('✅ Module initialized, starting crawler...');
  }

  @Cron(CustomCron.CRON_6_HOUR)
  async handleCrawlerDaotruyen() {
    const scheduledAt = new Date();
    const log = await this.batchLogsService.create(
      TaskJobName.CRAWL_DAO_TRUYEN,
      scheduledAt,
    );

    await this.taskQueue.add(TaskJobName.CRAWL_DAO_TRUYEN, {
      time: new Date().toISOString(),
      log_id: log.id,
    });
  }

  @Cron(CustomCron.CRON_8_HOUR)
  async fetchChapterMissing() {
    const scheduledAt = new Date();
    const log = await this.batchLogsService.create(
      TaskJobName.FETCH_MISSING_CHAPTERS,
      scheduledAt,
    );
    await this.taskQueue.add(TaskJobName.FETCH_MISSING_CHAPTERS, {
      time: new Date().toISOString(),
      log_id: log.id,
    });
  }

  @Cron(CustomCron.CRON_1_HOUR_10_MINUTE)
  async fetchSEOBook() {
    const scheduledAt = new Date();
    const log = await this.batchLogsService.create(
      TaskJobName.FETCH_SEO_BOOK,
      scheduledAt,
    );
    await this.taskQueue.add(TaskJobName.FETCH_SEO_BOOK, {
      time: new Date().toISOString(),
      log_id: log.id,
    });
  }
  // TODO UPDATE WITH BOOK
  // @Cron(CustomCron.CRON_EVERY_4_HOUR_30_MINUTE)
  // async googleIndexNews() {
  //   await this.taskQueue.add(TaskJobName.NEWS_FETCH_GOOGLE_INDEX, {
  //     time: new Date().toISOString(),
  //   });
  // }

  // @Cron(CustomCron.CRON_EVERY_5_HOUR_45_MINUTE)
  // async googleMetaDataNews() {
  //   await this.taskQueue.add(TaskJobName.NEWS_FETCH_GOOGLE_META, {
  //     time: new Date().toISOString(),
  //   });
  // }

  // @Cron(CustomCron.CRON_EVERY_12_HOUR_30_MINUTE)
  // async googleMetaDataPassedNews() {
  //   await this.taskQueue.add(TaskJobName.NEWS_FETCH_GOOGLE_META_PASSED, {
  //     time: new Date().toISOString(),
  //   });
  // }

  @Cron(CustomCron.CRON_EVERY_4_HOUR_30_MINUTE)
  async googleIndexNews() {
    const scheduledAt = new Date();
    const log = await this.batchLogsService.create(
      TaskJobName.NEWS_FETCH_GOOGLE_INDEX,
      scheduledAt,
    );

    await this.taskQueue.add(TaskJobName.NEWS_FETCH_GOOGLE_INDEX, {
      time: scheduledAt.toISOString(),
      log_id: log.id,
    });
  }

  @Cron(CustomCron.CRON_EVERY_5_HOUR_45_MINUTE)
  async googleMetaDataNews() {
    const scheduledAt = new Date();
    const log = await this.batchLogsService.create(
      TaskJobName.NEWS_FETCH_GOOGLE_META,
      scheduledAt,
    );

    await this.taskQueue.add(TaskJobName.NEWS_FETCH_GOOGLE_META, {
      time: new Date().toISOString(),
      log_id: log.id,
    });
  }

  @Cron(CustomCron.CRON_EVERY_12_HOUR_30_MINUTE)
  async googleMetaDataPassedNews() {
    const scheduledAt = new Date();
    const log = await this.batchLogsService.create(
      TaskJobName.NEWS_FETCH_GOOGLE_META_PASSED,
      scheduledAt,
    );

    await this.taskQueue.add(TaskJobName.NEWS_FETCH_GOOGLE_META_PASSED, {
      time: new Date().toISOString(),
      log_id: log.id,
    });
  }

  @Cron(CustomCron.CRON_4_HOUR_10_MINUTE)
  async handleCleanupOldPosts() {
    const scheduledAt = new Date();
    const log = await this.batchLogsService.create(
      TaskJobName.CLEANUP_OLD_POSTS,
      scheduledAt,
    );
    await this.taskQueue.add(TaskJobName.CLEANUP_OLD_POSTS, {
      time: new Date().toISOString(),
      log_id: log.id,
    });
  }

  @Cron(CustomCron.CRON_EVERY_3_HOUR_45_MINUTE)
  async handleCrawlerArticles() {
    const scheduledAt = new Date();
    const log = await this.batchLogsService.create(
      TaskJobName.CRAWL_ARTICLES,
      scheduledAt,
    );
    await this.taskQueue.add(TaskJobName.CRAWL_ARTICLES, {
      time: new Date().toISOString(),
      log_id: log.id,
    });
  }
}
