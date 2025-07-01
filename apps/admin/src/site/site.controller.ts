import { Headers } from '@nestjs/common';
import { BodyWithUser, UserParam } from '@app/decorators';
import { Site, User } from '@app/entities';
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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiParam,
  ApiTags,
  PickType,
} from '@nestjs/swagger';
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
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'site', version: '1' })
export class SiteController {
  constructor(private siteService: SiteService) {}

  @Get('/list')
  @ApiOkPaginatedResponse(Site, sitePaginateConfig)
  @ApiPaginationQuery(sitePaginateConfig)
  getAll(
    @Paginate() query: PaginateQuery,
    @UserParam() user: User,
    @Headers('workspaces') workspaces: string,
  ) {
    return this.siteService.getAll(query, user, workspaces);
  }

  @Post('/create')
  @ApiCreatedResponse({ type: Site })
  @ApiBody({ type: PickType(Site, []) })
  create(
    @BodyWithUser() createDto: SiteBodyDto,
    @UserParam() user: User,
    @Headers('workspaces') workspaces: string,
  ) {
    return this.siteService.create(user, createDto, workspaces);
  }

  // @Post('/telegram/:id')
  // getTelegram(
  //   @Body() body: { token: string },
  //   @Param(
  //     'id',
  //     ParseUUIDPipe,
  //     IsIDExistPipe({ entity: Site, checkOwner: true }),
  //   )
  //   site: Site,
  //   @Headers('workspaces') workspaces: string,
  // ) {
  //   return this.siteService.getTelegram(body.token, site);
  // }

  @Patch('update/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: PickType(Site, []) })
  partialUpdate(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({
        entity: Site,
        checkOwner: true,
        relations: ['sitePosts', 'categories'],
      }),
    )
    site: Site,
    @Headers('workspaces') workspaces: string,
    @BodyWithUser() updateDto: SiteBodyDto,
  ) {
    return this.siteService.update(site, updateDto, workspaces);
  }

  @Delete('/delete/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  delete(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({ entity: Site, checkOwner: true }),
    )
    site: Site,

    @UserParam() user: User,
  ) {
    return this.siteService.delete(site, user);
  }

  @Get('/:id/categories/list')
  getCategoriesBySiteId(@Param('id') id: string) {
    return this.siteService.getCategoriesBySiteId(id);
  }

  @Get('/:id/:category/posts/list')
  @ApiOkPaginatedResponse(Site, sitePaginateConfig)
  @ApiPaginationQuery(sitePaginateConfig)
  getPostBySiteId(
    @Paginate() query: PaginateQuery,
    @Param('id') id: string,
    @Param('category') category: string,
  ) {
    return this.siteService.getPostBySiteId(query, id, category);
  }

  @Get('/:id')
  @ApiParam({ name: 'id', type: 'varchar' })
  getById(
    @Param('id', IsIDExistPipe({ entity: Site, relations: ['categories'] }))
    site: Site,
  ) {
    return this.siteService.getById(site);
  }
}
