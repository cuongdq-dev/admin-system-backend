import { configLoads, MediaModule } from '@app/modules';
import { TypeORMConfigFactory } from '@app/modules/database/typeorm.factory';
import { MailerConfigClass } from '@app/modules/mail/mailerConfig.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as multer from 'multer';
import { AnalyticsModule } from './analytics/analytics.module';
import { EmailAuthModule } from './auth-email/email.module';
import { AuthModule } from './auth/auth.module';
import { BatchLogsModule } from './batch-logs/batch-log.module';
import { BookModule } from './book/book.module';
import { CategoryModule } from './category/category.module';
import { DockerModule } from './docker/docker.module';
import { DropdownModule } from './dropdown/dropdown.module';
import { GoogleModule } from './google-console/google.module';
import { I18nModule } from './i18n/i18n.module';
import { NotificationModule } from './notification/notification.module';
import { PostModule } from './post/post.module';
import { RepositoryModule } from './repository/repository.module';
import { ServerModule } from './server/server.module';
import { SettingModule } from './setting/setting.module';
import { SiteModule } from './site/site.module';
import { UserModule } from './user/user.module';
import { WebhookModule } from './webhook/webhook.module';

const modules = [
  AuthModule,
  UserModule,
  PostModule,
  BookModule,
  EmailAuthModule,
  I18nModule,
  GoogleModule,
  ServerModule,
  DockerModule,
  SiteModule,
  WebhookModule,
  DropdownModule,
  AnalyticsModule,
  SettingModule,
  BatchLogsModule,
  MediaModule,
  RepositoryModule,
  NotificationModule,
  CategoryModule,
];

export const global_modules = [
  ConfigModule.forRoot({
    load: configLoads,
    isGlobal: true,
    envFilePath: ['.env'],
  }),
  TypeOrmModule.forRootAsync({ useClass: TypeORMConfigFactory }),
  MailerModule.forRootAsync({ useClass: MailerConfigClass }),
  MulterModule.register({
    storage: multer.memoryStorage(),
  }),
];

@Module({
  imports: [...global_modules, ...modules],
})
export class AdminModule {}
