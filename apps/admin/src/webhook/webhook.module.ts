import { Category, Post, Site } from '@app/entities';
// import { TelegramService } from '@app/modules/telegram/telegram.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Category, Site])],
  controllers: [WebhookController],
  providers: [
    WebhookService,
    // TelegramService
  ],
})
export class WebhookModule {}
