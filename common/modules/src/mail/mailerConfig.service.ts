import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from 'path';

@Injectable()
export class MailerConfigClass implements MailerOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMailerOptions(): MailerOptions {
    return {
      transport: {
        host: this.configService.get('mail.host'),
        port: this.configService.get('mail.port'),
        ignoreTLS: this.configService.get('mail.ignoreTLS'),
        secure: this.configService.get('mail.secure'),
        requireTLS: this.configService.get('mail.requireTLS'),
        service: 'gmail',
        auth: {
          // type: this.configService.get('mail.type'),

          user: this.configService.get('mail.user'),
          pass: this.configService.get('mail.password'),
          // accessToken: this.configService.get('mail.accessToken'),
          // clientId: this.configService.get('mail.passwclientIdord'),
          // clientSecret: this.configService.get('mail.clientSecret'),
          // refreshToken: this.configService.get('mail.refreshToken'),
        },
      },
      defaults: {
        from: `"${this.configService.get(
          'mail.defaultName',
        )}" <${this.configService.get('mail.defaultEmail')}>`,
      },
      template: {
        dir: path.join(
          this.configService.get('app.workingDirectory'),
          'common',
          'modules',
          'src',
          'mail',
          'templates',
        ),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    };
  }
}
