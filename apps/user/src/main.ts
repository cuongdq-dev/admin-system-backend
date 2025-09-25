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
  const port = userConfigService.get('USER_PORT') || 3002;
  await app.listen(port);
  console.log('===== Application run:' + port + '=====');
}
bootstrap();
