import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  createApplication,
  documentationBuilder,
} from '../../../common/utils/src/bootstrap';
import { VpsModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(VpsModule);
  createApplication(app);
  const vpsConfigService = app.get(ConfigService);
  documentationBuilder(app, vpsConfigService, 'Vps');

  await app.listen(vpsConfigService.get('VPS_PORT'));
}
bootstrap();
