import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  port: parseInt(process.env.MAIL_PORT, 10),
  host: process.env.MAIL_HOST,
  user: process.env.MAIL_USER,
  password: process.env.MAIL_PASSWORD,
  defaultEmail: process.env.MAIL_DEFAULT_EMAIL,
  defaultName: process.env.MAIL_DEFAULT_NAME,
  ignoreTLS: process.env.MAIL_IGNORE_TLS === 'true',
  secure: process.env.MAIL_SECURE === 'true',
  requireTLS: process.env.MAIL_REQUIRE_TLS === 'true',
  //
  accessToken: process.env.MAIL_ACCESS_TOKEN,
  clientId: process.env.MAIL_CLIENT_ID,
  clientSecret: process.env.MAIL_CLIENT_SECRET,
  refreshToken: process.env.MAIL_REFRESH_TOKEN,
}));
