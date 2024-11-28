import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginationQuery, Paginate, PaginateQuery } from 'nestjs-paginate';
import { i18nPaginateConfig } from './i18n.pagination';
import { I18nService } from './i18n.service';
import { I18nUpdateDto } from './i18n.dto';
import { User } from 'common/entities/user.entity';
import { UserParam } from 'common/decorators/user.decorator';

@ApiTags('i18n')
@Controller({ path: 'i18n', version: '1' })
export class I18nController {
  constructor(private i18nService: I18nService) {}

  @Get('/:lang/lang.json')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'get Json i18n' })
  getJson(@Param() { lang }: { lang: string }) {
    return this.i18nService.getJson(lang);
  }

  @Get('')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'get code i18n' })
  getCodeI18n() {
    return this.i18nService.getCodeI18n();
  }

  @Get('/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'get i18n' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiPaginationQuery({ ...i18nPaginateConfig })
  getAll(
    @Paginate() paginateQuery: PaginateQuery,
    @Query() query: { lang: string },
  ) {
    return this.i18nService.getLang(paginateQuery, query.lang);
  }

  @Patch('/update/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update i18n' })
  async UpdateLang(
    @Param() { id }: { id: string },
    @Body() body: I18nUpdateDto,
    @UserParam() user: User,
  ) {
    return this.i18nService.UpdateLang(id, body, user);
  }
}
