import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { NewsTokenGuard } from './guards/news-token.guard';
import { NewsService } from './news.service';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ApiPaginationQuery, Paginate, PaginateQuery } from 'nestjs-paginate';
import { newsPaginateConfig } from './news.pagination';

@Controller('news')
@ApiBearerAuth()
@UseGuards(NewsTokenGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiPaginationQuery(newsPaginateConfig)
  getHome(@Req() req, @Paginate() query: PaginateQuery) {
    return this.newsService.getHome(req?.site, query);
  }

  @Get('posts')
  @ApiPaginationQuery(newsPaginateConfig)
  getAllNews(@Req() req, @Paginate() query: PaginateQuery) {
    return this.newsService.getAllNews(req.site, query);
  }

  @Get('posts/:slug')
  @ApiParam({ name: 'slug', type: 'varchar' })
  async getNewsBySlug(@Req() req, @Param() { slug }: { slug: string }) {
    return {
      message: 'Authorized request',
      data: await this.newsService.getNewsBySlug(req.site, slug),
    };
  }
}
