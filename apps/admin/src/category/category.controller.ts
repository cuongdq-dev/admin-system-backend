import { BodyWithUser, UserParam } from '@app/decorators';
import { Category, User } from '@app/entities';
import { RoleGuard } from '@app/guard/roles.guard';
import { PermissionDetailPipe } from '@app/pipes/permission.pipe';
import { workspaceEnum } from '@app/utils';
import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  SetMetadata,
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
  @SetMetadata('entity', Category)
  @SetMetadata('action', 'read')
  @UseGuards(RoleGuard)
  getAll(
    @Paginate() query: PaginateQuery,
    @UserParam() user: User,
    @Headers('workspaces') workspaces: string,
  ) {
    return this.categoryService.getAll(query, user, workspaces);
  }

  @Post('/create')
  @SetMetadata('entity', Category)
  @SetMetadata('action', 'create')
  @UseGuards(RoleGuard)
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
      PermissionDetailPipe({
        action: 'update',
        entity: Category,
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
      PermissionDetailPipe({
        entity: Category,
        action: 'delete',
        relations: ['posts'],
      }),
    )
    category: Category,

    @UserParam() user: User,
  ) {
    return this.categoryService.delete(category, user);
  }
}
