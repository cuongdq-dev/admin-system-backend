import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { YoutubesService } from './youtube.service';

@Controller('youtube')
export class YoutubesController {
  constructor(private readonly youtubesService: YoutubesService) {}

  @Get('youtube-research')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tìm kiếm kênh YouTube bằng Internal API' })
  @ApiQuery({
    name: 'keyword',
    required: false,
    description: 'Từ khóa tìm kiếm',
  })
  async searchYoutube(@Query('keyword') keyword?: string) {
    // Nếu không có continuation, keyword là bắt buộc
    if (!keyword) {
      throw new BadRequestException('Missing keyword or continuation token.');
    }

    return this.youtubesService.searchMultiplePages(keyword);
  }

  @Get('google-sheet')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tìm kiếm kênh YouTube bằng Internal API' })
  async googleSheet() {
    return this.youtubesService.googleSheet();
  }
}
