import { Controller, Get, Post, Delete, Query } from '@nestjs/common';
import { GoogleService } from './google.service';

@Controller('google')
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

  @Get('websites')
  async listWebsites() {
    return this.googleService.listWebsites();
  }

  @Get('sitemaps')
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
}
