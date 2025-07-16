import { BodyWithUser, UserParam } from '@app/decorators';
import { Category, Site, User } from '@app/entities';
import { RoleGuard } from '@app/guard/roles.guard';
import { PermissionDetailPipe } from '@app/pipes/permission.pipe';
import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  SetMetadata,
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
  @SetMetadata('entity', Site)
  @SetMetadata('action', 'read')
  @UseGuards(RoleGuard)
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
  @SetMetadata('entity', Category)
  @SetMetadata('action', 'create')
  @UseGuards(RoleGuard)
  create(
    @BodyWithUser() createDto: SiteBodyDto,
    @UserParam() user: User,
    @Headers('workspaces') workspaces: string,
  ) {
    return this.siteService.create(user, createDto, workspaces);
  }

  @Patch('update/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: PickType(Site, []) })
  partialUpdate(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({
        entity: Site,
        action: 'update',
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
      PermissionDetailPipe({ entity: Site, action: 'delete' }),
    )
    site: Site,

    @UserParam() user: User,
  ) {
    return this.siteService.delete(site, user);
  }

  @Get('/:id/categories/list')
  @SetMetadata('entity', Category)
  @SetMetadata('action', 'read')
  @UseGuards(RoleGuard)
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
    @Param(
      'id',
      PermissionDetailPipe({
        action: 'read',
        entity: Site,
        relations: ['categories'],
      }),
    )
    site: Site,
  ) {
    return this.siteService.getById(site);
  }
}
