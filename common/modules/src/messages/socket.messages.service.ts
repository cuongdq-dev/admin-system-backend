import { ConfigService } from '@app/config';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';

@Injectable()
export class SocketMessageService implements OnModuleDestroy {
  private readonly _logger = new Logger('SocketMessageService');
  private readonly _socketServerUrl =
    ConfigService.getInstance().get('SOCKET_SERVER_URL');
  private socket: Socket;

  constructor() {
    this.socket = io(this._socketServerUrl, { transports: ['websocket'] });
    this.socket.on('connect', () => {
      this._logger.verbose('Connected to WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      this._logger.error('Socket connection error:', error);
    });
  }

  async sendMessage(event: string, message: any) {
    this.socket.emit(event, message);
  }

  onModuleDestroy() {
    if (this.socket) {
      this._logger.verbose('Disconnecting from WebSocket server...');
      this.socket.disconnect();
    }
  }
}
