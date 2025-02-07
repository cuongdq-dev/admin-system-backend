import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { NewsTokenGuard } from './guards/news-token.guard';
import { NewsService } from './news.service';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@Controller('news')
@ApiBearerAuth()
@UseGuards(NewsTokenGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async getHome(@Req() req) {
    return {
      message: 'Authorized request',
      data: await this.newsService.getHome(req.site),
    };
  }

  @Get('posts')
  async getAllNews(@Req() req) {
    return {
      message: 'Authorized request',
      data: await this.newsService.getAllNews(req.site),
    };
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
