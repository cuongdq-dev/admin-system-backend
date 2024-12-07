import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  createApplication,
  documentationBuilder,
} from '../../../common/utils/src/bootstrap';
import { AdminModule } from './app.module';

async function bootstrap() {
  // Admin Module Setup
  const app = await NestFactory.create(AdminModule);
  createApplication(app);
  const adminConfigService = app.get(ConfigService);
  documentationBuilder(app, adminConfigService, 'Admin');

  await app.listen(adminConfigService.get('ADMIN_PORT') || 8001);
}
bootstrap();
