import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { ApiPaginationQuery, Paginate, PaginateQuery } from 'nestjs-paginate';
import { NewsTokenGuard } from './guards/news-token.guard';
import { newsPaginateConfig } from './news.pagination';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(NewsTokenGuard)
  getHome(@Req() req) {
    return this.newsService.getHome(req?.site);
  }

  @Get('/adsense')
  @ApiBearerAuth()
  @UseGuards(NewsTokenGuard)
  getAdsense(@Req() req) {
    return this.newsService.getAdsense(req?.site);
  }

  @Get('/relate')
  @ApiBearerAuth()
  @UseGuards(NewsTokenGuard)
  getRelate(@Req() req, @Query() query: { post_slug: string }) {
    return this.newsService.getPostRelates(req?.site, query.post_slug);
  }

  @Get('/recent')
  @ApiBearerAuth()
  @UseGuards(NewsTokenGuard)
  getRecent(@Req() req, @Query() query: { post_slug: string }) {
    return this.newsService.getPostRecents(req?.site, query.post_slug);
  }

  @Get('categories')
  @ApiBearerAuth()
  @UseGuards(NewsTokenGuard)
  @ApiPaginationQuery(newsPaginateConfig)
  getCategories(@Req() req) {
    return this.newsService.getCategories(req.site);
  }

  @Get('posts')
  @ApiBearerAuth()
  @UseGuards(NewsTokenGuard)
  @ApiPaginationQuery(newsPaginateConfig)
  getAllNews(@Req() req, @Paginate() query: PaginateQuery) {
    return this.newsService.getAllNews(req.site, query);
  }

  @Get('posts/category/:slug')
  @ApiBearerAuth()
  @UseGuards(NewsTokenGuard)
  @ApiParam({ name: 'slug', type: 'varchar' })
  @ApiPaginationQuery(newsPaginateConfig)
  getPostsByCategory(
    @Req() req,
    @Paginate() query: PaginateQuery,
    @Param() { slug }: { slug: string },
  ) {
    return this.newsService.getPostsByCategory(req.site, slug, query);
  }

  @Get('posts/:slug')
  @ApiBearerAuth()
  @UseGuards(NewsTokenGuard)
  @ApiParam({ name: 'slug', type: 'varchar' })
  async getNewsBySlug(@Req() req, @Param() { slug }: { slug: string }) {
    return this.newsService.getNewsBySlug(req.site, slug);
  }

  //rss
  @Get('rss')
  @ApiBearerAuth()
  @UseGuards(NewsTokenGuard)
  getRss(@Req() req) {
    return this.newsService.getRss(req.site);
  }

  //site map
  @Get('sitemap-categories')
  async getSitemapCategories(@Query('domain') domain: string) {
    if (!domain) throw new NotFoundException('Domain is required');
    return await this.newsService.getSitemapCategories(domain);
  }
  @Get('sitemap-total-posts')
  async getSitemapPosts(@Query('domain') domain: string) {
    if (!domain) throw new NotFoundException('Domain is required');
    return await this.newsService.getSitemapPosts(domain);
  }

  @Get('sitemap-posts')
  async getSitemapPostsByPage(
    @Query('domain') domain: string,
    @Query('page') page: number,
  ) {
    if (!domain) throw new NotFoundException('Domain is required');
    return await this.newsService.getSitemapPostsByPage(domain, page);
  }
}
