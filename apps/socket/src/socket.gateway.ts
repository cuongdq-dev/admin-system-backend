import { Logger } from '@nestjs/common';
import { CachingService } from '@app/modules/caching';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

type SocketQuery = {
  userName: string;
  uuid: string;
  channelId: string;
  app: string;
};
@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private wss: Socket;
  private _logger = new Logger('SocketGateway');

  async handleConnection(client: Socket) {
    const { userName, uuid, channelId, app } = client.handshake
      .query as SocketQuery;
    this._logger.verbose(
      `connect ===> id: ${client.id} - query: ${JSON.stringify(client.handshake.query)}`,
    );

    // Get channel
    const channel = channelId
      ? `${client.handshake.query.uuid}-${channelId}`
      : uuid;
    if (!channel) return;

    // Set cache for Redis
    this._logger.verbose(
      `joinChannel ===> id: ${client.id} - user: ${userName} - channelId: ${channelId || uuid}`,
    );
    await CachingService.getInstance().set(`socket-${channel}`, client.id);
    client.join(channelId || uuid);

    // Join handyman channel
    // if (app === 'handyman') client.join('handyman');
  }

  async handleDisconnect(client: Socket) {
    const { userName, uuid, channelId, app } = client.handshake
      .query as SocketQuery;
    this._logger.verbose(
      `disconnect ===> id: ${client.id} - query: ${JSON.stringify(client.handshake.query)}`,
    );

    // Get channel
    const channel = channelId
      ? `${client.handshake.query.uuid}-${channelId}`
      : uuid;
    if (!channel) return;

    // Get cache from Redis
    const currentClient = await CachingService.getInstance().get(
      `socket-${channel}`,
    );

    // When cache not exist
    if (!currentClient) return;

    // When cache exists
    this._logger.log(
      `channel: ${channel} - channelCache: ${currentClient} - id: ${client.id}`,
    );
    if (currentClient === client.id) {
      CachingService.getInstance().remove(`socket-${channel}`);
      this._logger.log(`channel: ${channel} - remove`);
      client.leave(channelId || uuid);
    }

    // leave handyman channel
    // if (app === 'handyman') client.join('handyman');
  }

  @SubscribeMessage('message')
  handleMessage(
    _: Socket,
    message: {
      channelId?: string | number;
      room?: string[];
      notificationType?: number;
    },
  ) {
    if (!message || !message.room) return;
    this._logger.verbose(
      `sendMessage ===> room: ${message.room} - message: ${JSON.stringify(message)}`,
    );
    this.wss.to(message.room).emit('message', { ...message, room: undefined });
  }

  @SubscribeMessage('job')
  handleJobNotification(
    _: Socket,
    message: {
      channelId?: string | number;
      room?: string[];
      notificationType?: number;
    },
  ) {
    if (!message || !message.room) return;
    this._logger.verbose(
      `sendNotification ===> room: ${message.room} - message: ${JSON.stringify(message)}`,
    );
    this.wss.to(message.room).emit('job', { ...message, room: undefined });
  }
}
