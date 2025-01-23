import { ValidationGroup } from '@app/crud/validation-group';
import { UserParam } from '@app/decorators';
import { PostCategory, User } from '@app/entities';
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
import { categoryPaginateConfig } from './category.pagination';
import { CategoryService } from './category.service';

@ApiTags('category')
@Controller({ path: 'category', version: '1' })
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Post('/create')
  @ApiBody({ type: PickType(PostCategory, ['slug', 'name', 'description']) })
  @ApiCreatedResponse({ type: PostCategory })
  create(@Body() createDto: PostCategory) {
    return this.categoryService.create(createDto);
  }

  @Get('/list')
  @ApiOkPaginatedResponse(PostCategory, categoryPaginateConfig)
  @ApiPaginationQuery(categoryPaginateConfig)
  getAll(@Paginate() query: PaginateQuery) {
    return this.categoryService.getAll(query);
  }

  @Patch('update/:id')
  @ApiBody({
    type: PickType(PostCategory, ['slug', 'description', 'name']),
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  partialUpdate(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({
        entity: PostCategory,
        filterField: 'id',
        relations: ['posts'],
      }),
    )
    category: PostCategory,

    @Body(
      new ValidationPipe({
        ...validationOptions,
        groups: [ValidationGroup.UPDATE],
      }),
    )
    updateDto: PostCategory,
  ) {
    return this.categoryService.update(category, updateDto);
  }

  @Delete('/delete/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  delete(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({
        entity: PostCategory,
        filterField: 'id',
        relations: ['posts'],
      }),
    )
    category: PostCategory,
  ) {
    console.log(category);
    return this.categoryService.delete(category);
  }
}
