import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginationQuery, Paginate, PaginateQuery } from 'nestjs-paginate';
import { i18nPaginateConfig } from './i18n.pagination';
import { I18nService } from './i18n.service';

@ApiTags('i18n')
@Controller({ path: 'i18n', version: '1' })
export class I18nController {
  constructor(private i18nService: I18nService) {}

  @Get('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'get code i18n' })
  getCodeI18n() {
    return this.i18nService.getCodeI18n();
  }

  @Get('/list-content')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'get i18n' })
  @ApiPaginationQuery({ ...i18nPaginateConfig })
  getAll(
    @Paginate() paginateQuery: PaginateQuery,
    @Query() query: { lang: string },
  ) {
    return this.i18nService.getLang(paginateQuery, query.lang);
  }

  @Post('/update/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update i18n' })
  async UpdateLang(@Param() id: string) {
    console.log(id);
    return this.i18nService.UpdateLang();
  }
}
