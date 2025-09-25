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
  const batchConfigService = app.get(ConfigService);
  documentationBuilder(app, batchConfigService, 'Batch');

  const port = batchConfigService.get('BATCH_PORT') || 3006;
  await app.listen(port);
  console.log('===== Application run:' + port + '=====');
}
bootstrap();
