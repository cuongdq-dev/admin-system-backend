import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
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

  handleConnection(client: Socket) {
    this._logger.verbose(
      `connect ===> id: ${client.id} - query: ${JSON.stringify(client.handshake.query)}`,
    );
  }

  handleDisconnect(client: Socket) {
    this._logger.verbose(
      `connect ===> id: ${client.id} - query: ${JSON.stringify(client.handshake.query)}`,
    );
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
  ): string {
    console.log('Received message from client:', message);
    this.wss.emit('message', message);
    return 'Message received on server';
  }
}
