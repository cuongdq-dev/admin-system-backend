import { Site } from '@app/entities';
import { IsIDExistPipe } from '@app/pipes';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  ApiOkPaginatedResponse,
  ApiPaginationQuery,
  Paginate,
  PaginateQuery,
} from 'nestjs-paginate';
import { SiteBodyDto } from './site.dto';
import { sitePaginateConfig } from './site.pagination';
import { SiteService } from './site.service';

@ApiTags('site')
@Controller({ path: 'site', version: '1' })
export class SiteController {
  constructor(private siteService: SiteService) {}

  @Get('/list')
  @ApiOkPaginatedResponse(Site, sitePaginateConfig)
  @ApiPaginationQuery(sitePaginateConfig)
  getAll(@Paginate() query: PaginateQuery) {
    return this.siteService.getAll(query);
  }

  @Post('/create')
  @ApiCreatedResponse({ type: Site })
  create(@Body() createDto: SiteBodyDto) {
    return this.siteService.create(createDto);
  }

  @Patch('update/:id')
  partialUpdate(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({
        entity: Site,
        filterField: 'id',
        relations: ['posts'],
      }),
    )
    site: Site,

    @Body() updateDto: SiteBodyDto,
  ) {
    return this.siteService.update(site, updateDto);
  }

  @Delete('/delete/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  delete(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({
        entity: Site,
        filterField: 'id',
        relations: ['posts'],
      }),
    )
    site: Site,
  ) {
    return this.siteService.delete(site);
  }
}
