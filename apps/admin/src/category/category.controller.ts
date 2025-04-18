import { BodyWithUser, UserParam } from '@app/decorators';
import { Category, User } from '@app/entities';
import { IsIDExistPipe } from '@app/pipes';
import {
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

@ApiTags('Category')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'category', version: '1' })
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('/list')
  @ApiOkPaginatedResponse(Category, categoryPaginateConfig)
  @ApiPaginationQuery(categoryPaginateConfig)
  getAll(@Paginate() query: PaginateQuery, @UserParam() user: User) {
    return this.categoryService.getAll(query, user);
  }

  @Post('/create')
  @ApiCreatedResponse({ type: Category })
  create(@BodyWithUser() createDto: CategoryBodyDto) {
    return this.categoryService.create(createDto);
  }

  @Patch('/update/:id')
  partialUpdate(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({
        entity: Category,
        checkOwner: true,
        relations: ['posts', 'sites'],
      }),
    )
    category: Category,

    @BodyWithUser() updateDto: CategoryBodyDto,
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
        checkOwner: true,
        relations: ['posts'],
      }),
    )
    category: Category,

    @UserParam() user: User,
  ) {
    return this.categoryService.delete(category, user);
  }
}
