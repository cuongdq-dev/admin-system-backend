import { Injectable, Logger } from '@nestjs/common';
import { SocketMessageService } from './socket.messages.service';

type NotificationOptions = { notification?: Notification };
type Notification = { type?: number; text?: string };

@Injectable()
export class MessagesService {
  private readonly _logger = new Logger('MessagesService');

  constructor(private readonly _socketService: SocketMessageService) {}

  async sendNotification(options: NotificationOptions) {
    this._logger.log(
      `<----- messages service ------> sendNotification --- options: ${JSON.stringify(options)}`,
    );

    const { notification } = options;

    this._socketService.sendMessage('message', notification);
  }
}
