import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ApiPaginationQuery, Paginate, PaginateQuery } from 'nestjs-paginate';
import { NewsTokenGuard } from './guards/news-token.guard';
import { newsPaginateConfig } from './news.pagination';
import { NewsService } from './news.service';

@Controller('news')
@ApiBearerAuth()
@UseGuards(NewsTokenGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  getHome(@Req() req, @Paginate() query: PaginateQuery) {
    return this.newsService.getHome(req?.site);
  }

  @Get('rss')
  getRss(@Req() req) {
    return this.newsService.getRss(req.site);
  }

  @Get('posts')
  @ApiPaginationQuery(newsPaginateConfig)
  getAllNews(@Req() req, @Paginate() query: PaginateQuery) {
    return this.newsService.getAllNews(req.site, query);
  }

  @Get('posts/:slug')
  @ApiParam({ name: 'slug', type: 'varchar' })
  async getNewsBySlug(@Req() req, @Param() { slug }: { slug: string }) {
    return this.newsService.getNewsBySlug(req.site, slug);
  }
}
