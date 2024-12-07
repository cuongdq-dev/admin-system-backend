import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { CustomerToken } from '@app/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerToken])],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
