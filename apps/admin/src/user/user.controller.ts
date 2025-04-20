import { Post as PostEntity, User } from '@app/entities';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiOkPaginatedResponse,
  ApiPaginationQuery,
  Paginate,
  PaginateQuery,
} from 'nestjs-paginate';
import { UserParam } from '../../../../common/decorators/src/user.decorator';
import { UserUpdateDto } from './user.dto';
import { postPaginateConfig } from './user.pagination';
import { UserService } from './user.service';

@ApiTags('User')
@ApiBearerAuth()
@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/me')
  @ApiOperation({ summary: 'get logged in user details' })
  async me(@UserParam() user: User) {
    return this.userService.findMe(user);
  }

  @Get('/post/list')
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
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'update logged in user' })
  @UseInterceptors(FileInterceptor('avatar'))
  async update(
    @UserParam() user: User,
    @UploadedFile() avatar: Express.Multer.File,
    @Body() updateDto: UserUpdateDto,
  ) {
    return this.userService.update(user, avatar, updateDto);
  }
}
