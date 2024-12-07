import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from 'common/entities/server.entity';
import { Service } from 'common/entities/service.entity';
import { ServerService as ServerSv } from 'common/entities/service_service.entity';
import { DockerController } from './docker.controller';
import { DockerService } from './docker.service';
import { Repository } from 'common/entities/repository.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server]),
    TypeOrmModule.forFeature([ServerSv]),
    TypeOrmModule.forFeature([Service]),
    TypeOrmModule.forFeature([Repository]),
  ],
  providers: [DockerService],
  controllers: [DockerController],
})
export class DockerModule {}
