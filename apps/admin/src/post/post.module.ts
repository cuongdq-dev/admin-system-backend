import {
  Media,
  Post,
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
      Trending,
      TrendingArticle,
      Media,
    ]),
  ],
  providers: [PostService],
  controllers: [PostController],
})
export class PostModule {}
