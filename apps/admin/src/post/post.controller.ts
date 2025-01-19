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
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import {
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
@Controller({ path: 'post', version: '1' })
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

  @Get('/fetch-trending')
  fetTrending() {
    return this.postService.handleCrawlerArticles();
  }

  @Get('/list')
  @ApiOkPaginatedResponse(PostEntity, postPaginateConfig)
  @ApiPaginationQuery(postPaginateConfig)
  getAll(@Paginate() query: PaginateQuery, @UserParam() user: User) {
    return this.postService.getAll(query);
  }

  // GET KEYWORD FROM GOOGLE: HOT SEARCH
  @Get('/trendings')
  @HttpCode(HttpStatus.OK)
  async getTrendings() {
    return this.postService.getTrendings();
  }
  //
  @Get(':slug')
  @ApiParam({ name: 'slug', type: 'varchar' })
  getOne(
    @Param(
      'slug',
      IsIDExistPipe({
        entity: PostEntity,
        filterField: 'slug',
        relations: [
          'user',
          'thumbnail',
          'article.trending',
          'article.thumbnail',
          'article.trending.thumbnail',
          'article.trending.articles',
        ],
      }),
    )
    post: PostEntity,
  ) {
    return this.postService.getPostBySlug(post);
  }

  @Patch(':id')
  @ApiBody({
    type: PickType(PostEntity, [
      'content',
      'title',
      'status',
      'meta_description',
      'relatedQueries',
    ]),
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  partialUpdate(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({
        entity: PostEntity,
        filterField: 'id',
        relations: [
          'user',
          'thumbnail',
          'article.trending',
          'article.thumbnail',
          'article.trending.thumbnail',
          'article.trending.articles',
        ],
      }),
    )
    post: PostEntity,

    @Body(
      new ValidationPipe({
        ...validationOptions,
        groups: [ValidationGroup.UPDATE],
      }),
    )
    updateDto: PostEntity,
  ) {
    return this.postService.update(post, updateDto);
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
