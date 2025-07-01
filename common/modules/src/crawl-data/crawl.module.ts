import {
  Book,
  Category,
  Chapter,
  GoogleIndexRequest,
  Media,
  Post,
  Site,
  SiteBook,
  SitePost,
  Trending,
  TrendingArticle,
  Notification,
  User,
} from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { TelegramModule } from '../telegram/telegram.module';
import { CrawlService } from './crawl.service';

@Module({
  imports: [
    // TelegramModule,
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
  providers: [CrawlService],
  exports: [CrawlService],
})
export class CrawlModule {}
