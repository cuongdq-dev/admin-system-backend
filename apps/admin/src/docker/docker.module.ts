import { Repository, Server, ServerService, Service } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DockerController } from './docker.controller';
import { DockerService } from './docker.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server]),
    TypeOrmModule.forFeature([ServerService]),
    TypeOrmModule.forFeature([Service]),
    TypeOrmModule.forFeature([Repository]),
  ],
  providers: [DockerService],
  controllers: [DockerController],
})
export class DockerModule {}
