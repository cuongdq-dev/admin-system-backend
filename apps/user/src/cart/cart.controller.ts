import { UserParam } from '@app/decorators';
import { CartItem, Customer } from '@app/entities';
import { IsIDExistPipe } from '@app/pipes';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiTags,
  PickType,
} from '@nestjs/swagger';
import { CartService } from './cart.service';

@ApiTags('Cart')
@Controller({
  path: 'carts',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private service: CartService) {}

  @Get()
  async getOrCreate(
    @UserParam()
    customer: Customer,
  ) {
    return this.service.getOrCreateActiveCart(customer);
  }

  @Post('upsert-item')
  @ApiBody({
    type: PickType(CartItem, ['variant_id', 'quantity']),
  })
  async updateActiveCart(
    @Body() itemUpdateDto: CartItem,
    @UserParam()
    customer: Customer,
  ) {
    return this.service.updateActiveCart(itemUpdateDto, customer);
  }

  @Post('empty-cart')
  async emptyActiveCart(
    @UserParam()
    customer: Customer,
  ) {
    return this.service.emptyActiveCart(customer);
  }

  @Delete('cart-items/:id')
  @ApiParam({
    type: 'string',
    format: 'uuid',
    name: 'id',
  })
  async removeCart(
    @Param(
      'id',
      ParseUUIDPipe,
      IsIDExistPipe({ entity: CartItem, relations: { cart: true } }),
    )
    cartItem: any,
    @UserParam()
    customer: Customer,
  ) {
    return this.service.removeItem(cartItem, customer);
  }
}
