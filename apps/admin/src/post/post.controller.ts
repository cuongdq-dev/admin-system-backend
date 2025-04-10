import { ValidationGroup } from '@app/crud/validation-group';
import { UserParam } from '@app/decorators';
import { Post as PostEntity, SitePost, Trending, User } from '@app/entities';
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
import { PostBodyDto } from './post.dto';
import { postPaginateConfig, trendingPaginateConfig } from './post.pagination';
import { PostService } from './post.service';

@ApiTags('Post')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'post', version: '1' })
export class PostController {
  constructor(private postService: PostService) {}

  @Get('/list')
  @ApiOkPaginatedResponse(PostEntity, postPaginateConfig)
  @ApiPaginationQuery(postPaginateConfig)
  getAll(@Paginate() query: PaginateQuery) {
    return this.postService.getAll(query);
  }

  @Get('/archived/list')
  @ApiOkPaginatedResponse(PostEntity, postPaginateConfig)
  @ApiPaginationQuery(postPaginateConfig)
  getArchived(@Paginate() query: PaginateQuery) {
    return this.postService.getArchived(query);
  }

  @Delete('/archived/delete/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  deletePostArchived(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({ entity: SitePost, filterField: 'id' }),
    )
    sitePost: SitePost,
  ) {
    return this.postService.deletePostArchived(sitePost);
  }

  @Get('/unused/list')
  @ApiOkPaginatedResponse(PostEntity, postPaginateConfig)
  @ApiPaginationQuery(postPaginateConfig)
  getNew(@Paginate() query: PaginateQuery) {
    return this.postService.getListUnused(query);
  }

  @Delete('/unused/delete/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  deletePostUnsed(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({
        entity: PostEntity,
        filterField: 'id',
        relations: [
          'article',
          'article.trending',
          'sitePosts',
          'thumbnail',
          'categories',
        ],
      }),
    )
    post: PostEntity,
  ) {
    return this.postService.deletePostUnused(post);
  }

  @Get('/trending/list')
  @ApiOkPaginatedResponse(Trending, trendingPaginateConfig)
  @ApiPaginationQuery(trendingPaginateConfig)
  async getTrendings(@Paginate() query: PaginateQuery) {
    return this.postService.getTrendings(query);
  }

  @Delete('/trending/delete/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  deleteTrending(@Param('id') trendingId: string) {
    return this.postService.deleteTrending(trendingId);
  }

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
          'categories',
          'sitePosts',
          'sitePosts.site',
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

  @Post()
  @ApiBody({ type: PickType(PostEntity, ['content', 'title']) })
  @ApiCreatedResponse({ type: PostEntity })
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
    updateDto: PostEntity & PostBodyDto,
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
