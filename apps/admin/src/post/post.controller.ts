import { ValidationGroup } from '@app/crud/validation-group';
import { UserParam } from '@app/decorators';
import { Post as PostEntity, User } from '@app/entities';
import { IsIDExistPipe } from '@app/pipes';
import validationOptions from '@app/utils/validation-options';
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
  ValidationPipe,
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
import { postPaginateConfig } from './post.pagination';
import { PostService } from './post.service';

@ApiTags('Post')
@Controller({
  path: 'posts',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class PostController {
  constructor(private postService: PostService) {}

  @Post()
  @ApiBody({
    type: PickType(PostEntity, ['content', 'title', 'is_published']),
  })
  @ApiCreatedResponse({
    type: PostEntity,
  })
  create(
    @Body(
      new ValidationPipe({
        ...validationOptions,
        groups: [ValidationGroup.CREATE],
      }),
    )
    createDto: PostEntity,
    @UserParam() user: User,
  ) {
    return this.postService.create(createDto, user);
  }

  @Get()
  @ApiOkPaginatedResponse(PostEntity, postPaginateConfig)
  @ApiPaginationQuery(postPaginateConfig)
  getAll(@Paginate() query: PaginateQuery, @UserParam() user: User) {
    return this.postService.getAll(user, query);
  }

  @Get(':id')
  @ApiCreatedResponse({
    type: PostEntity,
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  getOne(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({ entity: PostEntity, relations: { user: true } }),
    )
    post: PostEntity,
  ) {
    return post;
  }

  @Patch(':id')
  @ApiCreatedResponse({
    type: PostEntity,
  })
  @ApiBody({
    type: PickType(PostEntity, ['content', 'title', 'is_published']),
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  partialUpdate(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({ entity: PostEntity, relations: { user: true } }),
    )
    post: PostEntity,
    @Body(
      new ValidationPipe({
        ...validationOptions,
        groups: [ValidationGroup.UPDATE],
      }),
    )
    updateDto: PostEntity,
    @UserParam() user: User,
  ) {
    return this.postService.update(post, user, updateDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  delete(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({ entity: PostEntity, relations: { user: true } }),
    )
    post: PostEntity,
    @UserParam() user: User,
  ) {
    return this.postService.delete(post, user);
  }
}
