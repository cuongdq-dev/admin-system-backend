import { UserParam } from '@app/decorators';
import { Customer, Order } from '@app/entities';
import { IsIDExistPipe } from '@app/pipes';
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiPaginationQuery, Paginate, PaginateQuery } from 'nestjs-paginate';
import { orderPaginateConfig } from './order.pagination';
import { OrderService } from './order.service';

@ApiTags('Order')
@Controller({
  path: 'orders',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class OrderController {
  constructor(private service: OrderService) {}

  @Get()
  @ApiPaginationQuery(orderPaginateConfig)
  async getAll(
    @Paginate() query: PaginateQuery,
    @UserParam() customer: Customer,
  ) {
    return this.service.getAll(query, customer);
  }

  @Get(':id')
  @ApiParam({
    type: 'string',
    format: 'uuid',
    name: 'id',
  })
  async getOne(
    @Param('id', ParseUUIDPipe, IsIDExistPipe({ entity: Order }))
    order: Order,
  ) {
    return order;
  }
}
