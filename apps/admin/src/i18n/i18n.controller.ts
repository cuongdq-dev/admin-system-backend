import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nService } from './i18n.service';

@ApiTags('i18n')
@Controller({ path: 'i18n', version: '1' })
export class I18nController {
  constructor(private i18nService: I18nService) {}

  @Get('/:lang')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'get i18n' })
  async getLang(@Param('lang') lang: string) {
    return this.i18nService.getLang(lang);
  }
}
