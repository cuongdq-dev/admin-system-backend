import { configLoads, MediaModule } from '@app/modules';
import { TypeORMConfigFactory } from '@app/modules/database/typeorm.factory';
import { MailerConfigClass } from '@app/modules/mail/mailerConfig.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailAuthModule } from './auth-email/email.module';
import { AuthModule } from './auth/auth.module';
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
import { AnalyticsModule } from './analytics/analytics.module';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';

const modules = [
  AuthModule,
  UserModule,
  PostModule,
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
