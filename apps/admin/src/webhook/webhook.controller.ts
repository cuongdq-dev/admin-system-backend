import { Controller, Post, Req } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('webhook')
@Controller({ path: 'webhook', version: '1' })
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('telegram')
  async handleTelegramWebhook(@Req() req: any) {
    console.log('📥 Received Webhook:', req.body);
    await this.webhookService.processCallback(req.body);
  }
}
