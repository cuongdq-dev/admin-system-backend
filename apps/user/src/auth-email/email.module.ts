import { Customer } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CustomerModule } from '../customer/customer.module';
import { TokenModule } from '../token/token.module';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

@Module({
  imports: [
    CustomerModule,
    TokenModule,
    AuthModule,
    TypeOrmModule.forFeature([Customer]),
  ],
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailAuthModule {}
