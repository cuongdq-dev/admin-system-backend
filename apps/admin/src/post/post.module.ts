import {
  Category,
  Media,
  Post,
  Site,
  SitePost,
  Trending,
  TrendingArticle,
} from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      SitePost,
      Category,
      Trending,
      Site,
      TrendingArticle,
      Media,
    ]),
  ],
  providers: [PostService],
  controllers: [PostController],
})
export class PostModule {}
