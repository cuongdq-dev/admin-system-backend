import { ValidationGroup } from '@app/crud/validation-group';
import { UserParam } from '@app/decorators';
import { Server as ServerEntity, User } from '@app/entities';
import { OwnershipGuard } from '@app/guard';
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
import { ApiPaginationQuery, Paginate, PaginateQuery } from 'nestjs-paginate';
import { ServerCreateDto } from './server.dto';
import { serverPaginateConfig } from './server.pagination';
import { ServerService } from './server.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('server')
@Controller({ path: 'server', version: '1' })
export class ServerController {
  constructor(private serverService: ServerService) {}

  // API ACTION SERVER
  @Get('/connection/:id')
  @SetMetadata('entity', ServerEntity)
  @UseGuards(OwnershipGuard)
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  connectServer(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: ServerEntity }))
    server: ServerEntity,
    @UserParam() user: User,
  ) {
    return this.serverService.connectServer(server);
  }

  @Get('/list')
  @ApiOperation({ summary: 'get list server' })
  @SetMetadata('entity', ServerEntity)
  @ApiPaginationQuery({ ...serverPaginateConfig })
  getListServer(
    @Paginate() paginateQuery: PaginateQuery,
    @UserParam() user: User,
  ) {
    return this.serverService.getListServer(paginateQuery, user);
  }

  @Get('/detail/:connectionId/:id')
  @SetMetadata('entity', ServerEntity)
  @UseGuards(OwnershipGuard)
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'connectionId', type: 'string', format: 'uuid' })
  partialGetDetail(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: ServerEntity }))
    server: ServerEntity,
    @Param('connectionId')
    connectionId: string,
    @UserParam() user: User,
  ) {
    return this.serverService.getServerById(connectionId, server, user);
  }

  @Post('/create')
  @SetMetadata('entity', ServerEntity)
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

  @Get('/service/:serviceId/:connectionId')
  partialGetService(
    @Param() params: { serviceId: string; connectionId: string },
  ) {
    return this.serverService.getServiceInfo(params.connectionId);
  }

  @Get('/nginx/:serviceId/:connectionId')
  partialGetNginx(
    @Param() params: { serviceId: string; connectionId: string },
  ) {
    return this.serverService.getNginxInfo(params.serviceId);
  }

  @Post('/setup/service/:serviceId/:connectionId')
  setupService(@Param() params: { serviceId: string; connectionId: string }) {
    return this.serverService.setupService(
      params.serviceId,
      params.connectionId,
    );
  }

  @Post('/update/docker-compose/:connectionId')
  updateDockerCompose(
    @Param() params: { connectionId: string },
    @Body() body: { values?: Record<string, any> },
  ) {
    return this.serverService.updateDockerCompose(
      params.connectionId,
      body.values,
    );
  }

  @Post('/update/nginx/:connectionId')
  updateNginx(
    @Param() params: { connectionId: string },
    @Body() body: { fileContent?: string; fileName?: string },
  ) {
    return this.serverService.updateNginx(
      params.connectionId,
      body.fileContent,
      body.fileName,
    );
  }

  @Delete('/delete/nginx/:connectionId')
  deleteNginx(
    @Param() params: { connectionId: string },
    @Body() body: { fileName?: string },
  ) {
    return this.serverService.deleteNginx(params.connectionId, body.fileName);
  }

  @Get('/status/:connectionId')
  getServerStatus(
    @Param() params: { serviceId: string; connectionId: string },
  ) {
    return this.serverService.getServerStatus(params.connectionId);
  }
}
