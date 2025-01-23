import { configLoads } from '@app/modules';
import { TypeORMConfigFactory } from '@app/modules/database/typeorm.factory';
import { MailerConfigClass } from '@app/modules/mail/mailerConfig.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailAuthModule } from './auth-email/email.module';
import { AuthModule } from './auth/auth.module';
import { DockerModule } from './docker/docker.module';
import { I18nModule } from './i18n/i18n.module';
import { NotificationModule } from './notification/notification.module';
import { PostModule } from './post/post.module';
import { RepositoryModule } from './repository/repository.module';
import { ServerModule } from './server/server.module';
import { SettingModule } from './setting/setting.module';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';

const modules = [
  AuthModule,
  UserModule,
  PostModule,
  EmailAuthModule,
  I18nModule,
  ServerModule,
  DockerModule,
  SettingModule,
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
];

@Module({
  imports: [...global_modules, ...modules],
})
export class AdminModule {}
