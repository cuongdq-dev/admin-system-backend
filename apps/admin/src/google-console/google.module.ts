import {
  Category,
  GoogleIndexRequest,
  Media,
  Post,
  Site,
  SitePost,
  Trending,
  TrendingArticle,
  User,
} from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleController } from './google.controller';
import { GoogleService } from './google.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      User,
      SitePost,
      Category,
      GoogleIndexRequest,
      Site,
      Media,
      Trending,
      TrendingArticle,
    ]),
  ],
  controllers: [GoogleController],
  providers: [GoogleService],
  exports: [GoogleService],
})
export class GoogleModule {}
