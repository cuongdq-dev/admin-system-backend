import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  createApplication,
  documentationBuilder,
} from '../../../common/utils/src/bootstrap';
import { BatchModule } from './app.module';

async function bootstrap() {
  // Admin Module Setup
  const app = await NestFactory.create(BatchModule);
  createApplication(app);
  const adminConfigService = app.get(ConfigService);
  documentationBuilder(app, adminConfigService, 'Batch');

  await app.listen(adminConfigService.get('BATCH_PORT') || 3006);
}
bootstrap();
