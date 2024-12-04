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
import { Server as ServerEntity } from 'common/entities/server.entity';
import { User } from 'common/entities/user.entity';
import { OwnershipGuard } from 'common/guard/ownership.guard';
import { IsIDExistPipe } from 'common/pipes/IsIDExist.pipe';
import validationOptions from 'common/utils/validation-options';
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

  @Get('/list')
  @ApiOperation({ summary: 'get list server' })
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
    return this.serverService.getServiceInfo(
      params.serviceId,
      params.connectionId,
    );
  }
}
