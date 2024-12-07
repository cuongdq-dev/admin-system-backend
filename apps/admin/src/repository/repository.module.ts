import { Repository, Server } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepositoryController } from './repository.controller';
import { RepositoryService } from './repository.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server]),
    TypeOrmModule.forFeature([Repository]),
  ],
  providers: [RepositoryService],
  controllers: [RepositoryController],
})
export class RepositoryModule {}
