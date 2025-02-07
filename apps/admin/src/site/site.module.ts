import { Category, Post, Site, User } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionModule } from '../session/session.module';
import { TokenModule } from '../token/token.module';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';

@Module({
  imports: [
    TokenModule,
    SessionModule,
    TypeOrmModule.forFeature([Post, User, Category, Site]),
  ],
  providers: [SiteService],
  controllers: [SiteController],
})
export class SiteModule {}
