import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  createApplication,
  documentationBuilder,
} from '../../../common/utils/src/bootstrap';
import { UserAppModule } from './app.module';

async function bootstrap() {
  // User Module Setup
  const app = await NestFactory.create(UserAppModule);
  createApplication(app);
  const userConfigService = app.get(ConfigService);
  documentationBuilder(app, userConfigService, 'User');

  await app.listen(userConfigService.get('USER_PORT') || 8001);
}
bootstrap();
