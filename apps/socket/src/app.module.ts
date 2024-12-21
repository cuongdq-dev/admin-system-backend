import { configLoads } from '@app/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SocketGateway } from './app.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: configLoads,
      isGlobal: true,
      envFilePath: ['.env'],
    }),
  ],
  providers: [SocketGateway],
})
export class SocketModule {}
