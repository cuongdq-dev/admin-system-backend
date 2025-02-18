import {
  Category,
  Media,
  Post,
  Site,
  Trending,
  TrendingArticle,
  User,
} from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionModule } from '../session/session.module';
import { TokenModule } from '../token/token.module';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';
import { TaskService } from 'apps/batch/src/task/task.service';
import { TelegramModule } from '@app/modules/telegram/telegram.module';
import { TelegramService } from '@app/modules/telegram/telegram.service';

@Module({
  imports: [
    TokenModule,
    SessionModule,
    TelegramModule,

    TypeOrmModule.forFeature([
      Post,
      User,
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
