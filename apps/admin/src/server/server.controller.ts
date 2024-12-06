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
import { ApiPaginationQuery, Paginate, PaginateQuery } from 'nestjs-paginate';
import { ServerCreateDto, CreateRepositoryDto } from './server.dto';
import { serverPaginateConfig } from './server.pagination';
import { ServerService } from './server.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('server')
@Controller({ path: 'server', version: '1' })
export class ServerController {
  constructor(private serverService: ServerService) {}

  // API ACTION SERVER
  @Get('/list')
  @ApiOperation({ summary: 'get list server' })
  @UseGuards(OwnershipGuard)
  @ApiPaginationQuery({ ...serverPaginateConfig })
  getListServer(
    @Paginate() paginateQuery: PaginateQuery,
    @UserParam() user: User,
  ) {
    return this.serverService.getListServer(paginateQuery, user);
  }

  @Get('/detail/:id')
  @SetMetadata('entity', ServerEntity)
  @UseGuards(OwnershipGuard)
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  partialGetDetail(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: ServerEntity }))
    server: ServerEntity,
    @UserParam() user: User,
  ) {
    return this.serverService.getServerById(server, user);
  }

  @Post('/create')
  @SetMetadata('entity', ServerEntity)
  @UseGuards(OwnershipGuard)
  @ApiBody({
    type: PickType(ServerEntity, ['name', 'host', 'port', 'user', 'password']),
  })
  @ApiCreatedResponse({ type: ServerEntity })
  createServer(@Body() createDto: ServerCreateDto, @UserParam() user: User) {
    return this.serverService.createServer(createDto, user);
  }

  @Patch('/update/:id')
  @ApiCreatedResponse({ type: ServerEntity })
  @SetMetadata('entity', ServerEntity)
  @UseGuards(OwnershipGuard)
  @ApiBody({
    type: PickType(ServerEntity, ['host', 'name', 'port', 'user', 'password']),
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  partialUpdate(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: ServerEntity }))
    server: ServerEntity,

    @Body(
      new ValidationPipe({
        ...validationOptions,
        groups: [ValidationGroup.UPDATE],
      }),
    )
    updateDto: ServerEntity,

    @UserParam() user: User,
  ) {
    return this.serverService.updateServer(server, updateDto, user);
  }

  @Delete('/delete/:id')
  @SetMetadata('entity', ServerEntity)
  @UseGuards(OwnershipGuard)
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  partialDelete(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: ServerEntity }))
    server: ServerEntity,
    @UserParam() user: User,
  ) {
    return this.serverService.deleteServer(server, user);
  }
  // *****

  // API ACTION REPOSITORY

  @Get('/repository/:id/list')
  @SetMetadata('entity', ServerEntity)
  @ApiOperation({ summary: 'get list repository ' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @UseGuards(OwnershipGuard)
  getListRepository(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: ServerEntity }))
    server: ServerEntity,
    @UserParam()
    user: User,
  ) {
    return this.serverService.getListRepository(server, user);
  }

  @Post('/repository/:id/create')
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
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: ServerEntity }))
    server: ServerEntity,
    @Body() createDto: CreateRepositoryDto,
    @UserParam() user: User,
  ) {
    return this.serverService.createReposiroty(server, createDto, user);
  }

  @Patch('/repository/:server_id/update/:id')
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
    return this.serverService.updateReposiroty(repository, updateDto, user);
  }

  @Delete('/repository/:server_id/delete/:id')
  @SetMetadata('entity', Repository)
  @SetMetadata('owner_key', 'created_by')
  @UseGuards(OwnershipGuard)
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  deleteRepository(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: Repository }))
    repository: Repository,
    @UserParam() user: User,
  ) {
    return this.serverService.deleteReposiroty(repository, user);
  }

  // *****

  // API CALL TO API CONTROL

  @Get('/service/:serviceId/:connectionId')
  partialGetService(
    @Param() params: { serviceId: string; connectionId: string },
  ) {
    return this.serverService.getServiceInfo(
      params.serviceId,
      params.connectionId,
    );
  }

  @Get('/docker/:connectionId/containers/list')
  getDockerContainers(@Param() params: { connectionId: string }) {
    return this.serverService.getDockerContainers(params.connectionId);
  }

  @Get('/docker/:connectionId/images/list')
  getDockerImages(@Param() params: { connectionId: string }) {
    return this.serverService.getDockerImages(params.connectionId);
  }

  @Post('/docker/image/:connectionId/run')
  runDockerImages(
    @Param('connectionId') connectionId: string,
    @Body('imageName') imageName: string,
    @Body('containerName') containerName?: string,
  ) {
    return this.serverService.runDockerImage(
      connectionId,
      imageName,
      containerName,
    );
  }

  @Delete('/docker/image/:connectionId/:imageName')
  deleteDockerImage(
    @Param('connectionId') connectionId: string,
    @Param('imageName') imageName: string,
  ) {
    return this.serverService.deleteDockerImage(connectionId, imageName);
  }

  @Post('/docker/image/:connectionId/build')
  buildRepository(
    @Param('connectionId') connectionId: string,
    @Body('repositoryId') repositoryId: string,
  ) {
    return this.serverService.buildDockerImage(connectionId, repositoryId);
  }
}
