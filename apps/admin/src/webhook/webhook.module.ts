import { Category, Post } from '@app/entities';
import { TelegramService } from '@app/modules/telegram/telegram.service';
import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Category])],
  controllers: [WebhookController],
  providers: [WebhookService, TelegramService],
})
export class WebhookModule {}
