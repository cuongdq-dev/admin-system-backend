import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ApiPaginationQuery, Paginate, PaginateQuery } from 'nestjs-paginate';
import { booksPaginateConfig } from './books.pagination';
import { BooksService } from './books.service';
import { BooksTokenGuard } from './guards/books-token.guard';

@Controller('book')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(BooksTokenGuard)
  getHome(@Req() req) {
    return this.booksService.getHome(req?.site);
  }

  @Get('site-setting')
  @ApiBearerAuth()
  @UseGuards(BooksTokenGuard)
  getSiteSetting(@Req() req) {
    return this.booksService.getSiteSetting(req.site);
  }

  @Get('/adsense')
  @ApiBearerAuth()
  @UseGuards(BooksTokenGuard)
  getAdsense(@Req() req) {
    return this.booksService.getAdsense(req?.site);
  }

  @Get('categories')
  @ApiBearerAuth()
  @UseGuards(BooksTokenGuard)
  getCategories(@Req() req) {
    return this.booksService.getCategories(req.site);
  }

  @Get('list')
  @ApiBearerAuth()
  @UseGuards(BooksTokenGuard)
  @ApiPaginationQuery(booksPaginateConfig)
  getAllBooks(@Req() req, @Paginate() query: PaginateQuery) {
    return this.booksService.getAllBooks(req.site, query);
  }

  @Get('list/category/:slug')
  @ApiBearerAuth()
  @UseGuards(BooksTokenGuard)
  @ApiParam({ name: 'slug', type: 'varchar' })
  @ApiPaginationQuery(booksPaginateConfig)
  getBooksByCategory(
    @Req() req,
    @Paginate() query: PaginateQuery,
    @Param() { slug }: { slug: string },
  ) {
    return this.booksService.getAllBooks(req.site, query, slug);
  }

  @Get('detail/:slug')
  @ApiBearerAuth()
  @UseGuards(BooksTokenGuard)
  @ApiParam({ name: 'slug', type: 'varchar' })
  async getBookBySlug(@Req() req, @Param() { slug }: { slug: string }) {
    return this.booksService.getBookBySlug(req.site, slug);
  }

  @Get('detail/:slug/chapter/:chapter')
  @ApiBearerAuth()
  @UseGuards(BooksTokenGuard)
  @ApiParam({ name: 'slug', type: 'varchar' })
  async getChapterContent(
    @Req() req,
    @Param() { slug, chapter }: { slug: string; chapter: string },
  ) {
    return this.booksService.getChapterContent(req.site, slug, chapter);
  }

  //rss
  @Get('rss')
  @ApiBearerAuth()
  @UseGuards(BooksTokenGuard)
  getRss(@Req() req) {
    return this.booksService.getRss(req.site);
  }

  //site map
  @Get('sitemap-categories')
  async getSitemapCategories(@Query('domain') domain: string) {
    console.log(domain);
    if (!domain) throw new NotFoundException('Domain is required');
    return await this.booksService.getSitemapCategories(domain);
  }
  @Get('sitemap-total-books')
  async getSitemapBooks(@Query('domain') domain: string) {
    if (!domain) throw new NotFoundException('Domain is required');
    return await this.booksService.getSitemapBooks(domain);
  }

  @Get('sitemap-books')
  async getSitemapBooksByPage(
    @Query('domain') domain: string,
    @Query('page') page: number,
  ) {
    if (!domain) throw new NotFoundException('Domain is required');
    return await this.booksService.getSitemapBooksByPage(domain, page);
  }
}
