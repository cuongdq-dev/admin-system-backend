import { Category } from '@app/entities';
import { IsIDExistPipe } from '@app/pipes';
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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiOkPaginatedResponse,
  ApiPaginationQuery,
  Paginate,
  PaginateQuery,
} from 'nestjs-paginate';
import { CategoryBodyDto } from './category.dto';
import { categoryPaginateConfig } from './category.pagination';
import { CategoryService } from './category.service';

@ApiTags('category')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'category', version: '1' })
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('/list')
  @ApiOkPaginatedResponse(Category, categoryPaginateConfig)
  @ApiPaginationQuery(categoryPaginateConfig)
  getAll(@Paginate() query: PaginateQuery) {
    return this.categoryService.getAll(query);
  }

  @Post('/create')
  @ApiCreatedResponse({ type: Category })
  create(@Body() createDto: CategoryBodyDto) {
    return this.categoryService.create(createDto);
  }

  @Patch('update/:id')
  partialUpdate(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({
        entity: Category,
        filterField: 'id',
        relations: ['posts', 'sites'],
      }),
    )
    category: Category,

    @Body() updateDto: CategoryBodyDto,
  ) {
    return this.categoryService.update(category, updateDto);
  }

  @Delete('/delete/:id')
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
    return this.categoryService.delete(category);
  }
}
