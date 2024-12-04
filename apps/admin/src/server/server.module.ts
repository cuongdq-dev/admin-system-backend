import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from 'common/entities/server.entity';
import { Service } from 'common/entities/service.entity';
import { ServerService as ServerSv } from 'common/entities/service_service.entity';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server]),
    TypeOrmModule.forFeature([ServerSv]),
    TypeOrmModule.forFeature([Service]),
  ],
  providers: [ServerService],
  controllers: [ServerController],
})
export class ServerModule {}
