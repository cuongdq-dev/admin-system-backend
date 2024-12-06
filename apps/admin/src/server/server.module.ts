import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from 'common/entities/server.entity';
import { Service } from 'common/entities/service.entity';
import { ServerService as ServerSv } from 'common/entities/service_service.entity';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { Repository } from 'common/entities/repository.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server]),
    TypeOrmModule.forFeature([ServerSv]),
    TypeOrmModule.forFeature([Service]),
    TypeOrmModule.forFeature([Repository]),
  ],
  providers: [ServerService],
  controllers: [ServerController],
})
export class ServerModule {}
