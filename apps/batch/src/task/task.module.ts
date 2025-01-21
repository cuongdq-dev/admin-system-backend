import { Media, Post, Trending, TrendingArticle, User } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trending, TrendingArticle, User, Media, Post]),
  ],
  providers: [TaskService],
})
export class TaskModule {}
