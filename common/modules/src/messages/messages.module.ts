import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SocketMessageService } from './socket.messages.service';

@Module({
  imports: [],
  providers: [MessagesService, SocketMessageService],
  exports: [MessagesService, SocketMessageService],
})
export class MessagesModule {}
