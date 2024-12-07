import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { SocketModule } from './socket.module';

class SocketAdapter extends IoAdapter {
    createIOServer(port: number, options?: ServerOptions & { namespace?: string; server?: any }) {
        const server = super.createIOServer(port, { ...options, cors: true });
        return server;
    }
}

async function bootstrap() {
    const app = await NestFactory.create(SocketModule, { cors: true });
    app.useWebSocketAdapter(new SocketAdapter(app));
    await app.listen(3000);
}
bootstrap();
