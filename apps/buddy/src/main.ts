import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import {
  createApplication,
  documentationBuilder,
} from '../../../common/utils/src/bootstrap';
import { BuddyModule } from './app.module';

async function bootstrap() {
  // Admin Module Setup
  const app = await NestFactory.create(BuddyModule);
  app.use(express.json({ limit: '50mb' })); // For JSON payloads
  app.use(express.urlencoded({ limit: '50mb', extended: true })); // For URL-encoded payloads

  createApplication(app);
  const buddyConfigService = app.get(ConfigService);
  documentationBuilder(app, buddyConfigService, 'Buddy');
  const port = buddyConfigService.get('BUDDY_PORT') || 3007;
  await app.listen(port);

  console.log('===== Application run:' + port + '=====');
}
bootstrap();
