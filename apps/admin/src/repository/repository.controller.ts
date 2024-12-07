import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  SetMetadata,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  PickType,
} from '@nestjs/swagger';
import { ValidationGroup } from 'common/crud/validation-group';
import { UserParam } from 'common/decorators/user.decorator';
import { Repository } from 'common/entities/repository.entity';
import { Server as ServerEntity } from 'common/entities/server.entity';
import { User } from 'common/entities/user.entity';
import { OwnershipGuard } from 'common/guard/ownership.guard';
import { IsIDExistPipe } from 'common/pipes/IsIDExist.pipe';
import validationOptions from 'common/utils/validation-options';
import { CreateRepositoryDto } from './repository.dto';
import { RepositoryService } from './repository.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('repository')
@Controller({ path: 'repository', version: '1' })
export class RepositoryController {
  constructor(private repositoryService: RepositoryService) {}

  @Get('/:serverId/list')
  @SetMetadata('entity', ServerEntity)
  @ApiOperation({ summary: 'get list repository ' })
  @ApiParam({ name: 'serverId', type: 'string', format: 'uuid' })
  @UseGuards(OwnershipGuard)
  getListRepository(
    @Param('serverId', ParseUUIDPipe, IsIDExistPipe({ entity: ServerEntity }))
    server: ServerEntity,
    @UserParam()
    user: User,
  ) {
    return this.repositoryService.getListRepository(server, user);
  }

  @Post('/:serverId/create')
  @SetMetadata('entity', ServerEntity)
  @ApiCreatedResponse({ type: Repository })
  @UseGuards(OwnershipGuard)
  @ApiBody({
    type: PickType(Repository, [
      'name',
      'email',
      'username',
      'fine_grained_token',
    ]),
  })
  addRepository(
    @Param('serverId', ParseUUIDPipe, IsIDExistPipe({ entity: ServerEntity }))
    server: ServerEntity,
    @Body() createDto: CreateRepositoryDto,
    @UserParam() user: User,
  ) {
    return this.repositoryService.createReposiroty(server, createDto, user);
  }

  @Patch('/update/:id')
  @ApiCreatedResponse({ type: Repository })
  @SetMetadata('entity', Repository)
  @SetMetadata('owner_key', 'created_by')
  @UseGuards(OwnershipGuard)
  @ApiBody({
    type: PickType(Repository, [
      'name',
      'email',
      'username',
      'fine_grained_token',
    ]),
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  updateRepository(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: Repository }))
    repository: Repository,

    @Body(
      new ValidationPipe({
        ...validationOptions,
        groups: [ValidationGroup.UPDATE],
      }),
    )
    updateDto: Repository,

    @UserParam() user: User,
  ) {
    return this.repositoryService.updateReposiroty(repository, updateDto, user);
  }

  @Delete('/delete/:id')
  @SetMetadata('entity', Repository)
  @SetMetadata('owner_key', 'created_by')
  @UseGuards(OwnershipGuard)
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  deleteRepository(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: Repository }))
    repository: Repository,
    @UserParam() user: User,
  ) {
    return this.repositoryService.deleteReposiroty(repository, user);
  }
}