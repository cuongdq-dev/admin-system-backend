import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from 'common/entities/server.entity';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';

@Module({
  imports: [TypeOrmModule.forFeature([Server])],
  providers: [ServerService],
  controllers: [ServerController],
})
export class ServerModule {}
