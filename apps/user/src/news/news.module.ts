import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsTokenGuard } from './guards/news-token.guard';
import { Category, Post, Site } from '@app/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Site, Category, Post])],
  controllers: [NewsController],
  providers: [NewsService, NewsTokenGuard],
})
export class NewsModule {}
