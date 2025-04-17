import { Logger } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

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
  handleMessage(@MessageBody() message: string): string {
    console.log('Received message from client:', message);
    this.wss.emit('message', message);
    return 'Message received on server';
  }
}
