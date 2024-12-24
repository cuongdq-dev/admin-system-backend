import { UserParam } from '@app/decorators';
import { User } from '@app/entities';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPaginationQuery, PaginateQuery } from 'nestjs-paginate';
import { NotificationPaginateConfig } from './setting.pagination';
import { SettingService } from './setting.service';
import { AuthGuard } from '@nestjs/passport';

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
}
