import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { SocketModule } from './app.module';
import { ConfigService } from '@nestjs/config';

class SocketAdapter extends IoAdapter {
  createIOServer(
    port: number,
    options?: ServerOptions & { namespace?: string; server?: any },
  ) {
    const server = super.createIOServer(port, { ...options, cors: true });
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(SocketModule, { cors: true });
  app.useWebSocketAdapter(new SocketAdapter(app));
  const configService = app.get(ConfigService);
  const port = configService.get('SOCKET_PORT');

  await app.listen(port);
  console.log('===== Application run:' + port + '=====');
}
bootstrap();
