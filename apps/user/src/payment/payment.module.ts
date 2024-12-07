import { Payment } from '@app/entities';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressModule } from '../address/address.module';
import { CartModule } from '../cart/cart.module';
import { OrderModule } from '../order/order.module';
import { StripeModule } from '../stripe/stripe.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    forwardRef(() => OrderModule),
    AddressModule,
    CartModule,
    forwardRef(() => StripeModule),
    TypeOrmModule.forFeature([Payment]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
