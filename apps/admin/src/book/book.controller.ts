import { ValidationGroup } from '@app/crud/validation-group';
import { BodyWithUser, UserParam } from '@app/decorators';
import { Book, Chapter, User } from '@app/entities';
import { RoleGuard } from '@app/guard/roles.guard';
import { PermissionDetailPipe } from '@app/pipes/permission.pipe';
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
import { CreateBookDto } from './book.dto';
import { bookPaginateConfig } from './book.pagination';
import { BookService } from './book.service';

@ApiTags('Book')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'book', version: '1' })
export class BookController {
  constructor(private readonly BookService: BookService) {}

  @Get('/list')
  @ApiOkPaginatedResponse(Book, bookPaginateConfig)
  @ApiPaginationQuery(bookPaginateConfig)
  @SetMetadata('entity', Book)
  @SetMetadata('action', 'read')
  @UseGuards(RoleGuard)
  getAll(
    @Paginate() paginateQuery: PaginateQuery,
    @Query() query: { indexStatus?: string; site_id?: string; status?: string },
  ) {
    return this.BookService.getAll({
      ...paginateQuery,
      ...query,
      status: query?.status?.split(','),
    });
  }

  @Get(':slug')
  @ApiParam({ name: 'slug', type: 'varchar' })
  getBookBySlug(@Param() { slug }: { slug: string }, @UserParam() user: User) {
    return this.BookService.getBookBySlug(slug, user);
  }

  @Post()
  @ApiBody({
    type: PickType(Book, ['title', 'meta_description', 'thumbnail']),
  })
  @UseInterceptors(FileInterceptor('thumbnail'))
  @SetMetadata('entity', Book)
  @SetMetadata('action', 'create')
  @UseGuards(RoleGuard)
  @ApiCreatedResponse({ type: Book })
  async createBook(
    @BodyWithUser() body: CreateBookDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.BookService.create(body, file);
  }

  @Post('crawler/:id')
  @SetMetadata('entity', Chapter)
  @SetMetadata('action', 'create')
  @UseGuards(RoleGuard)
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiCreatedResponse({ type: Book })
  async crawlerBook(@Param() { id }: { id: string }) {
    return this.BookService.crawlerBook(id);
  }

  @Patch('update/:id')
  @ApiBody({
    type: PickType(Book, ['title', 'meta_description', 'keywords']),
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @UseInterceptors(FileInterceptor('thumbnail'))
  updateBook(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({
        entity: Book,
        action: 'update',
        filterField: 'id',
        relations: ['user', 'thumbnail'],
      }),
    )
    book: Book,

    @BodyWithUser(
      new ValidationPipe({
        ...validationOptions,
        groups: [ValidationGroup.UPDATE],
      }),
    )
    updateDto: CreateBookDto,
    @UserParam() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.BookService.update(book.id, updateDto, user, file);
  }

  @Patch('publish/:id')
  @ApiBody({ type: PickType(Book, ['status']) })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @UseInterceptors(FileInterceptor('thumbnail'))
  publishBook(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({
        entity: Book,
        action: 'publish',
        filterField: 'id',
      }),
    )
    book: Book,

    @BodyWithUser(
      new ValidationPipe({
        ...validationOptions,
        groups: [ValidationGroup.UPDATE],
      }),
    )
    updateDto: CreateBookDto,
    @UserParam() user: User,
  ) {
    return this.BookService.publishBook(book.id, updateDto, user);
  }

  @Post('generate-gemini/:id')
  @ApiBody({
    type: PickType(Book, ['title', 'meta_description', 'keywords']),
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  generateGemini(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({
        entity: Book,
        action: 'update',
        filterField: 'id',
        relations: ['chapters'],
      }),
    )
    book: Book,

    @BodyWithUser(
      new ValidationPipe({
        ...validationOptions,
        groups: [ValidationGroup.UPDATE],
      }),
    )
    updateDto: { chapterSlug: string },
    @UserParam() user: User,
  ) {
    return this.BookService.chapterGenerateGemini(
      book,
      user,
      updateDto.chapterSlug,
    );
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  deleteBook(
    @Param(
      'id',
      ParseUUIDPipe,
      PermissionDetailPipe({
        entity: Book,
        action: 'delete',
        relations: [
          'user',
          'thumbnail',
          'categories',
          'siteBooks',
          'siteBooks.site',
        ],
      }),
    )
    book: Book,
  ) {
    return this.BookService.delete(book);
  }
}
