import { Customer } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CustomerModule } from '../customer/customer.module';
import { GoogleController } from './google.controller';
import { GoogleService } from './google.service';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), CustomerModule, AuthModule],
  controllers: [GoogleController],
  providers: [GoogleService],
})
export class GoogleAuthModule {}
