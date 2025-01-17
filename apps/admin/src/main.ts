import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  createApplication,
  documentationBuilder,
} from '../../../common/utils/src/bootstrap';
import { AdminModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  // Admin Module Setup
  const app = await NestFactory.create(AdminModule);
  app.use(express.json({ limit: '50mb' })); // For JSON payloads
  app.use(express.urlencoded({ limit: '50mb', extended: true })); // For URL-encoded payloads

  createApplication(app);
  const adminConfigService = app.get(ConfigService);
  documentationBuilder(app, adminConfigService, 'Admin');

  await app.listen(adminConfigService.get('ADMIN_PORT') || 8001);
}
bootstrap();
