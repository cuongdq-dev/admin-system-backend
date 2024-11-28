import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configLoads } from '../../../common/modules/config';
import { TypeORMConfigFactory } from '../../../common/modules/database/typeorm.factory';
import { MailerConfigClass } from '../../../common/modules/mail/mailerConfig.service';
import { EmailAuthModule } from './auth-email/email.module';
import { AuthModule } from './auth/auth.module';
import { I18nModule } from './i18n/i18n.module';
import { PostModule } from './post/post.module';
import { ServerModule } from './server/server.module';
import { UserModule } from './user/user.module';

const modules = [
  AuthModule,
  UserModule,
  PostModule,
  EmailAuthModule,
  I18nModule,
  ServerModule,
];

export const global_modules = [
  ConfigModule.forRoot({
    load: configLoads,
    isGlobal: true,
    envFilePath: ['.env'],
  }),
  TypeOrmModule.forRootAsync({
    useClass: TypeORMConfigFactory,
  }),
  MailerModule.forRootAsync({
    useClass: MailerConfigClass,
  }),
];

@Module({
  imports: [...global_modules, ...modules],
})
export class AdminModule {}
