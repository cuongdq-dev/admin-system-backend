import {
  Book,
  Category,
  GoogleIndexRequest,
  Media,
  Post,
  Site,
  SiteBook,
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
      Book,
      User,
      SitePost,
      SiteBook,
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
