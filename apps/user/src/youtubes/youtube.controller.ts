import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
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
  @ApiQuery({
    name: 'max',
    required: false,

    description: 'Max Subs',
  })
  @ApiQuery({
    name: 'min',
    required: false,
    description: 'Min Subs',
  })
  async searchYoutube(
    @Query('keyword') keyword?: string,
    @Query('max', new DefaultValuePipe(200000), ParseIntPipe) max?: number,
    @Query('min', new DefaultValuePipe(100000), ParseIntPipe) min?: number,
  ) {
    // Nếu không có continuation, keyword là bắt buộc
    if (max !== undefined && min !== undefined && max < min) {
      throw new BadRequestException(
        'Giá trị "max" phải lớn hơn hoặc bằng "min".',
      );
    }

    if (!keyword) {
      throw new BadRequestException('Missing keyword or continuation token.');
    }

    return this.youtubesService.searchMultiplePagesWithNewSheet(
      keyword,
      max,
      min,
    );
  }

  // @Get('google-sheet')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Tìm kiếm kênh YouTube bằng Internal API' })
  // async googleSheet() {
  //   return this.youtubesService.googleSheet();
  // }

  // @Get('create-sheet')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Tìm kiếm kênh YouTube bằng Internal API' })
  // @ApiQuery({
  //   name: 'keyword',
  //   required: false,
  //   description: 'Từ khóa tìm kiếm',
  // })
  // async createSheet(@Query('keyword') keyword?: string) {
  //   return this.youtubesService.searchMultiplePagesWithNewSheet(keyword);
  // }
}
