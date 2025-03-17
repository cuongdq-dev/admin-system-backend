import {
  Category,
  Media,
  Post,
  Site,
  SitePost,
  Trending,
  TrendingArticle,
  User,
} from '@app/entities';
import { TelegramModule } from '@app/modules/telegram/telegram.module';
import { TelegramService } from '@app/modules/telegram/telegram.service';
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
    TelegramModule,

    TypeOrmModule.forFeature([
      Post,
      User,
      SitePost,
      Category,
      Site,
      Media,
      Trending,
      TrendingArticle,
    ]),
  ],
  providers: [SiteService, TelegramService],
  controllers: [SiteController],
})
export class SiteModule {}
