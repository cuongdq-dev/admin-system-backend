import { SitePost } from '@app/entities';
import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
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

  @Post('index')
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
  async listSitemaps(@Query() query: { site_id: string }) {
    return this.googleService.listSitemaps(query.site_id);
  }

  @Post('sitemaps/create')
  async submitSitemap(
    @Body('siteUrl') siteUrl: string,
    @Body('sitemapUrl') sitemapUrl: string,
  ) {
    return this.googleService.submitSitemap(siteUrl, sitemapUrl);
  }

  @Delete('sitemaps/delete')
  async deleteSitemap(
    @Body('siteUrl') siteUrl: string,
    @Body('sitemapUrl') sitemapUrl: string,
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

  @Get('logs/list')
  @ApiOkPaginatedResponse(SitePost, googleIndexingPaginateConfig)
  @ApiPaginationQuery(googleIndexingPaginateConfig)
  getLogs(
    @Paginate() paginateQuery: PaginateQuery,
    @Query() query: { site_id: string; type: string },
  ) {
    return this.googleService.getLogs(paginateQuery, {
      ...query,
      type: query?.type?.split(','),
    });
  }
}
