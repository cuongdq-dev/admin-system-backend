import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConfigService } from './config';
import { CustomServer } from './server/server';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix('api');
  const port = ConfigService.getInstance().getNumber('PORT') || 30090;
  const host = ConfigService.getInstance().get('HOST') || 'localhost';

  await app.listen(port, host, () => {
    logger.log(`Application is running on http://${host}:${port}`);
  });

  const customerServerHost = ConfigService.getInstance().get('CUSTOM_SERVER_HOST');
  const customServerPort = ConfigService.getInstance().getNumber('CUSTOM_SERVER_PORT');

  if (customerServerHost && customServerPort) {
    app.connectMicroservice<MicroserviceOptions>({
      strategy: new CustomServer(customServerPort, customerServerHost)
    });

    await app.startAllMicroservices();
  }
}
bootstrap();
