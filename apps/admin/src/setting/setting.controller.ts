import { UserParam } from '@app/decorators';
import { User } from '@app/entities';
import { BadRequestException, Headers, Query } from '@nestjs/common';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SettingService } from './setting.service';

@ApiTags('setting')
@Controller({ path: 'setting', version: '1' })
export class SettingController {
  constructor(private settingService: SettingService) {}

  @Get('')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  getSeting(
    @UserParam() user: User,
    @Headers('workspaces') workspaces: string,
  ) {
    return this.settingService.getSetting(user, workspaces);
  }

  @Post('firebase-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  setFirebaseToken(
    @UserParam() user: User,
    @Body() { token }: { token: string },
  ) {
    return this.settingService.setFirebaseToken(token, user);
  }

  @Get('youtube-research')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tìm kiếm kênh YouTube bằng Internal API' })
  @ApiQuery({
    name: 'keyword',
    required: false,
    description: 'Từ khóa tìm kiếm',
  })
  @ApiQuery({
    name: 'continuation',
    required: false,
    description: 'Token để tiếp tục trang tiếp theo',
  })
  async searchYoutube(
    @Query('keyword') keyword?: string,
    @Query('continuation') continuation?: string,
  ) {
    // Nếu không có continuation, keyword là bắt buộc
    if (!keyword) {
      throw new BadRequestException('Missing keyword or continuation token.');
    }

    return this.settingService.searchMultiplePages(continuation, keyword);
  }
}
