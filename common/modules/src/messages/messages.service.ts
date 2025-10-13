import { Injectable, Logger } from '@nestjs/common';
// import { SocketMessageService } from './socket.messages.service';
import { ISocket } from './message.dto';
@Injectable()
export class MessagesService {
  private readonly _logger = new Logger('MessagesService');

  // constructor(private readonly _socketService: SocketMessageService) {}

  async sendNotification(socket: ISocket) {
    this._logger.log(
      `<----- messages service ------> sendNotification --- socket: ${JSON.stringify(
        socket,
      )}`,
    );
    // this._socketService.sendMessage('message', socket);
  }
}
