import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';
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
  constructor(@InjectQueue('task-queue') private taskQueue: Queue) {}

  async onModuleInit() {
    this.logger.log('✅ Module initialized, starting crawler...');
  }

  // @Cron(CronExpression.EVERY_5_SECONDS)
  // async scheduleCleanTempFilesJob() {
  //   console.log('⏰ Thêm job clean-temp-files vào queue...');

  //   await this.taskQueue.add(TaskJobName.CLEAN_TEMP_FILES, {
  //     time: new Date().toISOString(),
  //   });

  //   console.log('✅ Job clean-temp-files đã được thêm vào queue.');
  // }

  @Cron(CustomCron.CRON_6_HOUR)
  async handleCrawlerDaotruyen() {
    await this.taskQueue.add(TaskJobName.CRAWL_DAO_TRUYEN, {
      time: new Date().toISOString(),
    });
  }

  @Cron(CustomCron.CRON_8_HOUR)
  async fetchChapterMissing() {
    await this.taskQueue.add(TaskJobName.FETCH_MISSING_CHAPTERS, {
      time: new Date().toISOString(),
    });
  }

  @Cron(CustomCron.CRON_1_HOUR_10_MINUTE)
  async fetchSEOBook() {
    await this.taskQueue.add(TaskJobName.FETCH_SEO_BOOK, {
      time: new Date().toISOString(),
    });
  }

  @Cron(CustomCron.CRON_EVERY_4_HOUR_30_MINUTE)
  async googleIndex() {
    await this.taskQueue.add(TaskJobName.FETCH_GOOGLE_INDEX, {
      time: new Date().toISOString(),
    });
  }

  @Cron(CustomCron.CRON_EVERY_5_HOUR_45_MINUTE)
  async googleMetaData() {
    await this.taskQueue.add(TaskJobName.FETCH_GOOGLE_META, {
      time: new Date().toISOString(),
    });
  }

  @Cron(CustomCron.CRON_EVERY_12_HOUR_30_MINUTE)
  async googleMetaDataPassed() {
    await this.taskQueue.add(TaskJobName.FETCH_GOOGLE_META_PASSED, {
      time: new Date().toISOString(),
    });
  }

  @Cron(CustomCron.CRON_4_HOUR_10_MINUTE)
  async handleCleanupOldPosts() {
    await this.taskQueue.add(TaskJobName.CLEANUP_OLD_POSTS, {
      time: new Date().toISOString(),
    });
  }

  @Cron(CustomCron.CRON_EVERY_3_HOUR_45_MINUTE)
  async handleCrawlerArticles() {
    await this.taskQueue.add(TaskJobName.CRAWL_ARTICLES, {
      time: new Date().toISOString(),
    });
  }
}
