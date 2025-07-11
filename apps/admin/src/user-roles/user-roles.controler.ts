import { BodyWithUser, UserParam } from '@app/decorators';
import { Role, User } from '@app/entities';
import { IsIDExistPipe } from '@app/pipes';
import {
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
import { RoleBodyDto } from './user-roles.dto';
import { userRolesPaginateConfig } from './user-roles.pagination';
import { UserRolesService } from './user-roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'roles', version: '1' })
export class UserRolesController {
  constructor(private userRolesService: UserRolesService) {}

  @Get('/list')
  @ApiOkPaginatedResponse(Role, userRolesPaginateConfig)
  @ApiPaginationQuery(userRolesPaginateConfig)
  getAll(@Paginate() query: PaginateQuery, @UserParam() user: User) {
    return this.userRolesService.getAll(query, user);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'varchar' })
  getDetail(
    @Param(
      'id',
      IsIDExistPipe({
        entity: Role,
        filterField: 'id',
        relations: ['users', 'permissions'],
      }),
    )
    role: Role,
  ) {
    return this.userRolesService.getDetail(role);
  }

  @Post('/create')
  @ApiCreatedResponse({ type: Role })
  @ApiBody({ type: PickType(Role, []) })
  create(@BodyWithUser() createDto: RoleBodyDto, @UserParam() user: User) {
    return this.userRolesService.create(user, createDto);
  }

  @Patch('update/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: PickType(Role, []) })
  partialUpdate(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({
        entity: Role,
        relations: ['users', 'permissions'],
      }),
    )
    role: Role,
    @BodyWithUser() updateDto: RoleBodyDto,
  ) {
    return this.userRolesService.update(role, updateDto);
  }

  @Delete('/delete/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  delete(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: Role }))
    role: Role,
  ) {
    return this.userRolesService.delete(role);
  }
}
