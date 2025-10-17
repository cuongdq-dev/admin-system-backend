import { Category, Media, Post, Site, SitePost, User } from '@app/entities';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailController } from '../auth-email/email.controller';
import { EmailService } from '../auth-email/email.service';
import { SessionModule } from '../session/session.module';
import { TokenModule } from '../token/token.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh.strategy';
import { FirebaseModule } from '@app/modules/firebase/firebase.module';

@Module({
  imports: [
    UserModule,
    TokenModule,
    FirebaseModule,
    SessionModule,
    TypeOrmModule.forFeature([User, Media, Site, Post, Category, SitePost]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('auth.secret'),
        signOptions: {
          expiresIn: configService.get('auth.refreshTokenExpiresIn'),
        },
      }),
    }),
  ],
  controllers: [EmailController, AuthController],
  providers: [EmailService, AuthService, JwtStrategy, RefreshJwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
