import {
  Category,
  Post,
  Site,
  SitePost,
  Trending,
  GoogleIndexRequest,
  TrendingArticle,
  Book,
  SiteBook,
} from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      Site,
      Category,
      SitePost,
      Book,
      SiteBook,
      Trending,
      TrendingArticle,
      GoogleIndexRequest,
    ]),
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
