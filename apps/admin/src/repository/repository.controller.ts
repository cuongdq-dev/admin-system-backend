import { UserParam } from '@app/decorators';
import { Repository, Server as ServerEntity, User } from '@app/entities';
import { OwnershipGuard } from '@app/guard';
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
  SetMetadata,
  UseGuards,
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
import { CreateRepositoryDto, UpdateRepositoryDto } from './repository.dto';
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
    return this.repositoryService.getListRepository(server);
  }

  @Post('/:connectionId/:serverId/create')
  @SetMetadata('entity', ServerEntity)
  @UseGuards(OwnershipGuard)
  @ApiBody({
    type: PickType(CreateRepositoryDto, [
      'name',
      'email',
      'username',
      'fine_grained_token',
      'services',
      'repo_env',
      'with_docker_compose',
      'with_env',
    ]),
  })
  addRepository(
    @Param('serverId', ParseUUIDPipe, IsIDExistPipe({ entity: ServerEntity }))
    server: ServerEntity,
    @Param('connectionId') connectionId: string,
    @Body() createDto: CreateRepositoryDto,
    @UserParam() user: User,
  ) {
    return this.repositoryService.createReposiroty(
      connectionId,
      server,
      createDto,
      user,
    );
  }

  @Patch('/update/:id')
  @SetMetadata('entity', Repository)
  @SetMetadata('owner_key', 'created_by')
  @UseGuards(OwnershipGuard)
  @ApiBody({
    type: PickType(UpdateRepositoryDto, [
      'name',
      'email',
      'username',
      'fine_grained_token',
      'services',
      'repo_env',
    ]),
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  updateRepository(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: Repository }))
    repository: Repository,
    @Body()
    updateDto: UpdateRepositoryDto,

    @UserParam() user: User,
  ) {
    return this.repositoryService.updateReposiroty(repository, updateDto, user);
  }

  @Patch('/:connectionId/clone/:id')
  @ApiCreatedResponse({ type: Repository })
  @SetMetadata('entity', Repository)
  @SetMetadata('owner_key', 'created_by')
  @UseGuards(OwnershipGuard)
  @ApiBody({
    type: PickType(UpdateRepositoryDto, [
      'name',
      'email',
      'username',
      'fine_grained_token',
    ]),
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  cloneRepository(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: Repository }))
    repository: Repository,
    @Param('connectionId') connectionId: string,
    @Body()
    updateDto: UpdateRepositoryDto,

    @UserParam() user: User,
  ) {
    return this.repositoryService.cloneRepository(
      connectionId,
      repository,
      updateDto,
      user,
    );
  }

  @Patch('/:connectionId/build/:id')
  @ApiCreatedResponse({ type: Repository })
  @SetMetadata('entity', Repository)
  @SetMetadata('owner_key', 'created_by')
  @UseGuards(OwnershipGuard)
  @ApiBody({
    type: PickType(UpdateRepositoryDto, ['services', 'repo_env']),
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  buildRepository(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: Repository }))
    repository: Repository,
    @Param('connectionId') connectionId: string,
    @UserParam() user: User,
  ) {
    return this.repositoryService.buildReposiroty(
      connectionId,
      repository,
      user,
    );
  }

  @Delete(':connectionId/delete/:id')
  @SetMetadata('entity', Repository)
  @SetMetadata('owner_key', 'created_by')
  @UseGuards(OwnershipGuard)
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  deleteRepository(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: Repository }))
    repository: Repository,
    @Param('connectionId') connectionId: string,
    @UserParam() user: User,
  ) {
    return this.repositoryService.deleteReposiroty(
      connectionId,
      repository,
      user,
    );
  }
}
