import { BodyWithUser, UserParam } from '@app/decorators';
import { Post as PostEntity, Role, User } from '@app/entities';
import { RoleGuard } from '@app/guard/roles.guard';
import { PermissionDetailPipe } from '@app/pipes/permission.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  PickType,
} from '@nestjs/swagger';
import {
  ApiOkPaginatedResponse,
  ApiPaginationQuery,
  Paginate,
  PaginateQuery,
} from 'nestjs-paginate';
import { UserUpdateDto } from './user.dto';
import { postPaginateConfig, userPaginateConfig } from './user.pagination';
import { UserService } from './user.service';
@ApiTags('User')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/list')
  @ApiOkPaginatedResponse(User, userPaginateConfig)
  @ApiPaginationQuery(userPaginateConfig)
  @SetMetadata('entity', User)
  @SetMetadata('action', 'read')
  @UseGuards(RoleGuard)
  getAll(@Paginate() query: PaginateQuery, @UserParam() user: User) {
    return this.userService.getAll(query, user);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'varchar' })
  getDetail(
    @Param(
      'id',
      PermissionDetailPipe({
        entity: User,
        action: 'read',
        filterField: 'id',
        relations: ['roles', 'avatar', 'banner'],
      }),
    )
    user: User,
  ) {
    return this.userService.getDetail(user);
  }

  @Post('/create')
  @SetMetadata('entity', User)
  @SetMetadata('action', 'create')
  @UseGuards(RoleGuard)
  @ApiCreatedResponse({ type: Role })
  @ApiBody({ type: PickType(Role, []) })
  create(@BodyWithUser() body: UserUpdateDto, @UserParam() user: User) {
    return this.userService.create(user, body);
  }

  @Patch('update/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: PickType(User, []) })
  partialUpdate(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({
        action: 'update',
        entity: User,
        relations: ['roles'],
      }),
    )
    user: User,
    @BodyWithUser() updateDto: UserUpdateDto,
  ) {
    return this.userService.update(user, updateDto);
  }

  @Patch('publish/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: PickType(User, []) })
  partialPublish(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({
        action: 'publish',
        entity: User,
        relations: ['roles'],
      }),
    )
    user: User,
    @BodyWithUser() updateDto: UserUpdateDto,
  ) {
    return this.userService.publish(user, updateDto);
  }

  @Get('/me')
  @SetMetadata('entity', User)
  @SetMetadata('action', 'read')
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'get logged in user details' })
  async me(@UserParam() user: User) {
    return this.userService.findMe(user);
  }

  @Get('/post/list')
  @SetMetadata('entity', User)
  @SetMetadata('action', 'read')
  @UseGuards(RoleGuard)
  @ApiOkPaginatedResponse(PostEntity, postPaginateConfig)
  @ApiPaginationQuery(postPaginateConfig)
  getPostByUser(
    @Paginate() paginateQuery: PaginateQuery,
    @Query() query: { indexStatus?: string; site_id?: string; status?: string },
    @UserParam() user: User,
  ) {
    return this.userService.getPostByUser(
      {
        ...paginateQuery,
        ...query,
        status: query?.status?.split(','),
        created_by: user.id,
      },
      user,
    );
  }

  @Patch('/me')
  @ApiResponse({ status: HttpStatus.OK, description: 'Update logged in user' })
  @ApiOperation({ summary: 'update logged in user' })
  async update(@UserParam() user: User, @Body() updateDto: UserUpdateDto) {
    return this.userService.updateProfile(user, updateDto);
  }

  @Patch('/me/avatar')
  @ApiResponse({ status: HttpStatus.OK, description: 'Update logged in user' })
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @UserParam() user: User,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return this.userService.uploadAvatar(user, avatar);
  }

  @Patch('/me/banner')
  @ApiBody({ type: PickType(User, []) })
  @ApiResponse({ status: HttpStatus.OK, description: 'Update logged in user' })
  @UseInterceptors(FileInterceptor('banner'))
  async uploadBanner(
    @UserParam() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.uploadBanner(user, file);
  }

  @Delete('/delete/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  delete(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({ action: 'delete', entity: User }),
    )
    user: User,
  ) {
    return this.userService.delete(user);
  }
}
