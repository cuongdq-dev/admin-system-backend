import { MailerModule } from '@nestjs-modules/mailer';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressModule } from './address/address.module';
import { EmailAuthModule } from './auth-email/email.module';
import { GoogleAuthModule } from './auth-google/google.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { CustomerModule } from './customer/customer.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { ProductVariantModule } from './product-variant/product-variant.module';
import { ProductModule } from './product/product.module';
import { StripeModule } from './stripe/stripe.module';

import { configLoads } from '@app/modules';
import { TypeORMConfigFactory } from '@app/modules/database/typeorm.factory';
import { MailerConfigClass } from '@app/modules/mail/mailerConfig.service';

const modules = [
  AuthModule,
  EmailAuthModule,
  GoogleAuthModule,
  CustomerModule,
  AddressModule,
  ProductModule,
  ProductVariantModule,
  CartModule,
  PaymentModule,
  OrderModule,
  forwardRef(() => StripeModule),
];

export const global_modules = [
  ConfigModule.forRoot({
    load: configLoads,
    isGlobal: true,
    envFilePath: ['.env'],
  }),
  TypeOrmModule.forRootAsync({
    useClass: TypeORMConfigFactory,
  }),
  MailerModule.forRootAsync({
    useClass: MailerConfigClass,
  }),
];

@Module({
  imports: [...global_modules, ...modules],
})
export class UserAppModule {}
