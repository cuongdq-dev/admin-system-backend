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
import { Headers } from '@nestjs/common';
import { workspaceEnum } from '@app/utils';

@ApiTags('Category')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'category', version: '1' })
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('/list')
  @ApiOkPaginatedResponse(Category, categoryPaginateConfig)
  @ApiPaginationQuery(categoryPaginateConfig)
  getAll(
    @Paginate() query: PaginateQuery,
    @UserParam() user: User,
    @Headers('workspaces') workspaces: string,
  ) {
    return this.categoryService.getAll(query, user, workspaces);
  }

  @Post('/create')
  @ApiCreatedResponse({ type: Category })
  create(
    @BodyWithUser() createDto: CategoryBodyDto,
    @Headers('workspaces') workspaces: string,
  ) {
    return this.categoryService.create({
      ...createDto,
      status: workspaceEnum[workspaces],
    });
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

    @Headers('workspaces') workspaces: string,
  ) {
    return this.categoryService.update(category, {
      ...updateDto,
      status: workspaceEnum[workspaces],
    });
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
