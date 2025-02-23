import {
  Repository,
  Server,
  ServerService as ServerServiceEntity,
  Service,
} from '@app/entities';
import { MessagesModule } from '@app/modules/messages/messages.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server]),
    TypeOrmModule.forFeature([ServerServiceEntity]),
    TypeOrmModule.forFeature([Service]),
    TypeOrmModule.forFeature([Repository]),
  ],
  providers: [ServerService],
  controllers: [ServerController],
})
export class ServerModule {}
