import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { Post, Category } from '@app/entities';
import { PostStatus } from '@app/entities/post.entity';

dotenv.config();

@Injectable()
export class TelegramService {
  private readonly botToken = process.env.TELE_BOT_TOKEN;
  private readonly chatId = process.env.TELE_BOT_CHAT_ID;
  private readonly telegramApiUrl = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

  async sendMessage(post: Post, categories?: { name: string; slug: string }[]) {
    if (!this.chatId) {
      console.error('🚨 TELE_CHAT_ID is missing! Please check your .env file.');
      return;
    }

    const { buttons, message } = this.generateTelegramMessage(post, categories);

    try {
      const payload: any = {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'Markdown',
      };

      if (buttons) {
        payload.reply_markup = {
          inline_keyboard: buttons,
        };
      }

      const response = await fetch(this.telegramApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.ok) {
        console.log('📨 Message sent successfully to Telegram');
      } else {
        console.error('⚠️ Failed to send message:', result);
      }
    } catch (error) {
      console.error('🚨 Telegram API Error:', error.message);
    }
  }

  async editMessage(
    chatId: number,
    messageId: number,
    post: Post,
    categories?: { name: string; slug: string }[],
  ) {
    const { buttons, message: newText } = this.generateTelegramMessage(
      post,
      categories,
    );
    const payload: any = {
      chat_id: chatId,
      message_id: messageId,
      text: newText,
      parse_mode: 'Markdown',
    };

    if (buttons) {
      payload.reply_markup = { inline_keyboard: buttons };
    }

    const response = await fetch(`${this.telegramApiUrl}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('⚠️ Failed to edit message:', data);
    }
  }

  generateTelegramMessage(
    savedPost: Post,
    categories: { name: string; slug: string }[],
  ) {
    const categoryButtons = [];
    const chunkSize = 3; // Số nút mỗi hàng (có thể chỉnh về 2 nếu cần)
    for (let i = 0; i < categories.length; i += chunkSize) {
      const row = categories.slice(i, i + chunkSize).map((cat) => ({
        text: `${cat.name}`, // Giữ icon duy nhất
        callback_data: `cat_${savedPost.id}_${cat.slug}`,
      }));
      categoryButtons.push(row);
    }

    const message =
      `📰 *${savedPost.status}*\n` +
      `📌 *Tiêu đề:* ${savedPost.title}\n` +
      `📖 *Mô tả:* ${savedPost.meta_description}\n` +
      (savedPost.categories?.length > 0
        ? `*Category:* ${savedPost.categories.map((category) => category.name).join(', ')}\n`
        : '') +
      (savedPost.status != PostStatus.DELETED
        ? `\n👉 *Nhấn vào nút bên dưới để chọn danh mục!*`
        : '');

    let actionButtons: any[] = [];

    if (savedPost.status === PostStatus.PUBLISHED) {
      actionButtons = [
        [
          {
            text: '✏️ Draft',
            callback_data: `draft_${savedPost.id}`,
          },
          {
            text: '🗑 Xoá',
            callback_data: `delete_${savedPost.id}`,
          },
          {
            text: '👀 Xem',
            url: `https://news.ck-tech.asia/posts/${savedPost.slug}`,
          },
        ],
      ];
    } else if (
      savedPost.status === PostStatus.DRAFT ||
      savedPost.status === PostStatus.NEW
    ) {
      actionButtons = [
        [
          {
            text: '🌍 Public',
            callback_data: `public_${savedPost.id}`,
          },
          {
            text: '🗑 Xoá',
            callback_data: `delete_${savedPost.id}`,
          },
          {
            text: '👀 Xem',
            url: `https://news.ck-tech.asia/posts/${savedPost.slug}`,
          },
        ],
      ];
    }

    return {
      message,
      buttons:
        savedPost.status == PostStatus.DELETED
          ? []
          : [...categoryButtons, ...actionButtons],
    };
  }
}
