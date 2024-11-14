import { NestFactory } from '@nestjs/core';
import { UserAppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  createApplication,
  documentationBuilder,
} from '../../../common/utils/bootstrap';

async function bootstrap() {
  // User Module Setup
  const app = await NestFactory.create(UserAppModule, { rawBody: true });
  createApplication(app);
  const userConfigService = app.get(ConfigService);
  documentationBuilder(app, userConfigService);
  await app.listen(userConfigService.get('APP_PORT') || 8000);
}
bootstrap();
