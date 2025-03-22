import { SitePost } from '@app/entities';
import { Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiOkPaginatedResponse,
  ApiPaginationQuery,
  Paginate,
  PaginateQuery,
} from 'nestjs-paginate';
import { googleIndexingPaginateConfig } from './google.pagination';
import { GoogleService } from './google.service';

@Controller({ path: 'google', version: '1' })
@ApiTags('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get('index')
  async submitToGoogleIndex(@Query('url') url: string) {
    return this.googleService.submitToGoogleIndex(url);
  }

  @Get('metadata')
  async getMetaDataGoogleConsole(
    @Query('url') url: string,
    @Query('domain') domain: string,
  ) {
    return this.googleService.getMetaDataGoogleConsole(url, domain);
  }

  @Get('websites/list')
  async listWebsites() {
    return this.googleService.listWebsites();
  }

  @Get('sitemaps/list')
  async listSitemaps(@Query('siteUrl') siteUrl: string) {
    return this.googleService.listSitemaps(siteUrl);
  }

  @Post('sitemap')
  async submitSitemap(
    @Query('siteUrl') siteUrl: string,
    @Query('sitemapUrl') sitemapUrl: string,
  ) {
    return this.googleService.submitSitemap(siteUrl, sitemapUrl);
  }

  @Delete('sitemap')
  async deleteSitemap(
    @Query('siteUrl') siteUrl: string,
    @Query('sitemapUrl') sitemapUrl: string,
  ) {
    return this.googleService.deleteSitemap(siteUrl, sitemapUrl);
  }

  //GET INDEXING STATUS BY SITE_ID
  @Get('indexing/list')
  @ApiOkPaginatedResponse(SitePost, googleIndexingPaginateConfig)
  @ApiPaginationQuery(googleIndexingPaginateConfig)
  getSiteIndexing(
    @Paginate() paginateQuery: PaginateQuery,
    @Query() query: { indexStatus?: string; site_id: string },
  ) {
    return this.googleService.getSiteIndexing(paginateQuery, {
      ...query,
      indexStatus: query?.indexStatus?.split(','),
    });
  }
}
