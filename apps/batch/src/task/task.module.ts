import { Media, Post, Trending, TrendingArticle } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskService } from './task.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trending, TrendingArticle, Media, Post])],
  providers: [TaskService],
})
export class TaskModule {}
