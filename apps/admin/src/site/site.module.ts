import { Category, Post, Site, User } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { RefreshJwtStrategy } from '../auth/strategies/refresh.strategy';
import { TokenModule } from '../token/token.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    TokenModule,
    SessionModule,
    TypeOrmModule.forFeature([Post, User, Category, Site]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('auth.secret'),
        signOptions: {},
      }),
    }),
  ],
  providers: [SiteService, JwtStrategy, RefreshJwtStrategy],
  controllers: [SiteController],
})
export class SiteModule {}
