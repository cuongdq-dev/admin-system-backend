import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('/post')
  getAnalyticsPosts(@Headers('workspaces') workspaces: string) {
    return this.analyticsService.getAnalyticsPosts(workspaces);
  }

  @Get('/category')
  getAnalyticsCategories() {
    return this.analyticsService.getAnalyticsCategories();
  }
  @Get('/category-news')
  getAnalyticsNewCategories() {
    return this.analyticsService.getAnalyticsNewsCategories();
  }
  @Get('/category-books')
  getAnalyticsBookCategories() {
    return this.analyticsService.getAnalyticsBookCategories();
  }

  @Get('/trending')
  getAnalyticsTrendings() {
    return this.analyticsService.getAnalyticsTrendings();
  }

  @Get('/site')
  getAnalyticsSite(@Headers('workspaces') workspaces: string) {
    return this.analyticsService.getAnalyticsSite(workspaces);
  }
  @Get('/source')
  getAnalyticsSource(@Headers('workspaces') workspaces: string) {
    return this.analyticsService.getAnalyticsSource(workspaces);
  }

  @Get('/google-indexed')
  getAnalyticsGoogleIndexed(@Headers('workspaces') workspaces: string) {
    return this.analyticsService.getAnalyticsGoogleIndexed(workspaces);
  }

  @Get('/google-search-status')
  getAnalyticsGoogleSearchStatus(@Headers('workspaces') workspaces: string) {
    return this.analyticsService.getAnalyticsGoogleSearchStatus(workspaces);
  }
}
