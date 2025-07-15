import { ValidationGroup } from '@app/crud/validation-group';
import { BodyWithUser, UserParam } from '@app/decorators';
import { Post as PostEntity, SitePost, Trending, User } from '@app/entities';
import { RoleGuard } from '@app/guard/roles.guard';
import { PermissionDetailPipe } from '@app/pipes/permission.pipe';
import { IsIDExistPipe } from '@app/pipes/IsIDExist.pipe';
import validationOptions from '@app/utils/validation-options';
import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { CreatePostDto } from './post.dto';
import { postPaginateConfig, trendingPaginateConfig } from './post.pagination';
import { PostService } from './post.service';

@ApiTags('Post')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'post', version: '1' })
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('/list')
  @ApiOkPaginatedResponse(PostEntity, postPaginateConfig)
  @ApiPaginationQuery(postPaginateConfig)
  @SetMetadata('entity', PostEntity)
  @SetMetadata('action', 'read')
  @UseGuards(RoleGuard)
  getAll(
    @Paginate() paginateQuery: PaginateQuery,
    @Query() query: { indexStatus?: string; site_id?: string; status?: string },
    @UserParam() user: User,
  ) {
    const paramQuery = {
      status: query?.status?.split(','),
      created_by: user.id,
    };

    return this.postService.getAll({
      ...paginateQuery,
      ...query,
      ...paramQuery,
    });
  }

  @Get('/archived/list')
  @ApiOkPaginatedResponse(PostEntity, postPaginateConfig)
  @ApiPaginationQuery(postPaginateConfig)
  @UseGuards(RoleGuard)
  @SetMetadata('entity', PostEntity)
  @SetMetadata('action', 'read')
  getArchived(
    @Paginate() paginate: PaginateQuery,
    @Query() query: { indexStatus?: string; site_id: string },
  ) {
    return this.postService.getArchived({ ...paginate, ...query });
  }

  @Delete('/archived/delete/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  deleteArchivedPost(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({
        entity: SitePost,
        subject: 'posts',
        filterField: 'id',
      }),
    )
    sitePost: SitePost,
  ) {
    return this.postService.deletePostArchived(sitePost);
  }

  @Get('/unused/list')
  @SetMetadata('entity', PostEntity)
  @UseGuards(RoleGuard)
  @SetMetadata('action', 'read')
  @ApiOkPaginatedResponse(PostEntity, postPaginateConfig)
  @ApiPaginationQuery(postPaginateConfig)
  getUnusedPosts(
    @Paginate() paginate: PaginateQuery,
    @Query() query: { indexStatus?: string; site_id: string },
  ) {
    return this.postService.getListUnused({ ...paginate, ...query });
  }

  @Delete('/unused/delete/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  deleteUnusedPost(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({
        action: 'delete',
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
  @SetMetadata('entity', PostEntity)
  @UseGuards(RoleGuard)
  @SetMetadata('action', 'read')
  getTrendingPosts(@Paginate() query: PaginateQuery) {
    return this.postService.getTrendings(query);
  }

  @Delete('/trending/delete/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  deleteTrendingPost(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({
        action: 'delete',
        entity: Trending,
        subject: 'posts',
        filterField: 'id',
      }),
    )
    post: PostEntity,
  ) {
    return this.postService.deleteTrending(post.id);
  }

  @Get(':slug')
  @ApiParam({ name: 'slug', type: 'varchar' })
  getPostBySlug(
    @Param(
      'slug',
      PermissionDetailPipe({
        entity: PostEntity,
        action: 'read',
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

    @UserParam() user: User,
  ) {
    return this.postService.getPostBySlug(post, user);
  }

  @Post()
  @ApiBody({
    type: PickType(PostEntity, [
      'content',
      'title',
      'status',
      'meta_description',
      'relatedQueries',
      'thumbnail',
    ]),
  })
  @UseInterceptors(FileInterceptor('thumbnail'))
  @SetMetadata('entity', PostEntity)
  @SetMetadata('action', 'create')
  @UseGuards(RoleGuard)
  @ApiCreatedResponse({ type: PostEntity })
  async createPost(
    @BodyWithUser() body: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.postService.create(body, file);
  }

  @Patch('update/:id')
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
  @UseInterceptors(FileInterceptor('thumbnail'))
  updatePost(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({
        action: 'update',
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

    @BodyWithUser(
      new ValidationPipe({
        ...validationOptions,
        groups: [ValidationGroup.UPDATE],
      }),
    )
    updateDto: CreatePostDto,
    @UserParam() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.postService.update(post.id, updateDto, user, file);
  }

  @Patch('publish/:id')
  @ApiBody({ type: PickType(PostEntity, ['status']) })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @UseInterceptors(FileInterceptor('thumbnail'))
  publishPost(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({
        action: 'update',
        entity: PostEntity,
        filterField: 'id',
      }),
    )
    post: PostEntity,

    @BodyWithUser(
      new ValidationPipe({
        ...validationOptions,
        groups: [ValidationGroup.UPDATE],
      }),
    )
    updateDto: CreatePostDto,
    @UserParam() user: User,
  ) {
    return this.postService.publishPost(post.id, updateDto, user);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  deletePost(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({
        entity: PostEntity,
        action: 'delete',
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
    return this.postService.delete(post);
  }
}
