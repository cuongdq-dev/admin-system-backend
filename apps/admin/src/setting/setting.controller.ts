import { UserParam } from '@app/decorators';
import { User } from '@app/entities';
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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SettingService } from './setting.service';

@ApiTags('setting')
@Controller({ path: 'setting', version: '1' })
export class SettingController {
  constructor(private settingService: SettingService) {}

  @Get('')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  getSeting(@UserParam() user: User) {
    return this.settingService.getSetting(user);
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
}
