import { ValidationGroup } from '@app/crud/validation-group';
import { Category } from '@app/entities';
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
import { categoryPaginateConfig } from './category.pagination';
import { CategoryService } from './category.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('category')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'category', version: '1' })
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Post('/create')
  @ApiBody({ type: PickType(Category, ['slug', 'name', 'description']) })
  @ApiCreatedResponse({ type: Category })
  create(@Body() createDto: Category) {
    return this.categoryService.create(createDto);
  }

  @Get('/list')
  @ApiOkPaginatedResponse(Category, categoryPaginateConfig)
  @ApiPaginationQuery(categoryPaginateConfig)
  getAll(@Paginate() query: PaginateQuery) {
    return this.categoryService.getAll(query);
  }

  @Patch('update/:id')
  @ApiBody({
    type: PickType(Category, ['slug', 'description', 'name']),
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  partialUpdate(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({
        entity: Category,
        filterField: 'id',
        relations: ['posts'],
      }),
    )
    category: Category,

    @Body(
      new ValidationPipe({
        ...validationOptions,
        groups: [ValidationGroup.UPDATE],
      }),
    )
    updateDto: Category,
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
        entity: Category,
        filterField: 'id',
        relations: ['posts'],
      }),
    )
    category: Category,
  ) {
    console.log(category);
    return this.categoryService.delete(category);
  }
}
