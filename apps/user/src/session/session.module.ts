import { CustomerSession } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionService } from './session.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerSession])],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
