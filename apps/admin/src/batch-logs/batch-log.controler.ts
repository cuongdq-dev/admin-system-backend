import { UserParam } from '@app/decorators';
import { Site, User } from '@app/entities';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiOkPaginatedResponse,
  ApiPaginationQuery,
  Paginate,
  PaginateQuery,
} from 'nestjs-paginate';
import { batchLogsPaginateConfig } from './batch-log.pagination';
import { BatchLogsService } from './batch-log.service';

@ApiTags('batch-logs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'batch-logs', version: '1' })
export class BatchLogsController {
  constructor(private batchLogs: BatchLogsService) {}

  @Get('/list')
  @ApiOkPaginatedResponse(Site, batchLogsPaginateConfig)
  @ApiPaginationQuery(batchLogsPaginateConfig)
  getAll(@Paginate() query: PaginateQuery, @UserParam() user: User) {
    return this.batchLogs.getAll(query, user);
  }
}
