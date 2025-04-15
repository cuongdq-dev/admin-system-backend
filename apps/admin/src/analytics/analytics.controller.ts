import { Controller, Get, UseGuards } from '@nestjs/common';
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
  getAnalyticsPosts() {
    return this.analyticsService.getAnalyticsPosts();
  }

  @Get('/category')
  getAnalyticsCategories() {
    return this.analyticsService.getAnalyticsCategories();
  }

  @Get('/trending')
  getAnalyticsTrendings() {
    return this.analyticsService.getAnalyticsTrendings();
  }

  @Get('/site')
  getAnalyticsSite() {
    return this.analyticsService.getAnalyticsSite();
  }
  @Get('/source')
  getAnalyticsSource() {
    return this.analyticsService.getAnalyticsSource();
  }

  @Get('/google-indexed')
  getAnalyticsGoogleIndexed() {
    return this.analyticsService.getAnalyticsGoogleIndexed();
  }

  @Get('/google-search-status')
  getAnalyticsGoogleSearchStatus() {
    return this.analyticsService.getAnalyticsGoogleSearchStatus();
  }
}
