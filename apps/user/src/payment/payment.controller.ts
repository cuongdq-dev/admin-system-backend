import { UserParam } from '@app/decorators';
import { Customer } from '@app/entities';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPaginationQuery, Paginate, PaginateQuery } from 'nestjs-paginate';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { paymentPaginateConfig } from './payment.pagination';
import { PaymentService } from './payment.service';

@ApiTags('Payment')
@Controller({
  path: 'payments',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class PaymentController {
  constructor(private service: PaymentService) {}

  @Get()
  @ApiPaginationQuery(paymentPaginateConfig)
  async getAll(
    @Paginate() query: PaginateQuery,
    @UserParam() customer: Customer,
  ) {
    return this.service.getAll(query, customer);
  }

  @Post()
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @UserParam() customer: Customer,
  ) {
    return this.service.create(createPaymentDto, customer);
  }
}
