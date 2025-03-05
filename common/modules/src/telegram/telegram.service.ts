import { Post } from '@app/entities';
import { PostStatus } from '@app/entities/post.entity';
import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class TelegramService {
  private readonly telegramApiUrl = `https://api.telegram.org`;

  async sendBotAddedNotification(
    siteName: string,
    chatId: string,
    chatToken: string,
  ) {
    try {
      const url = `https://api.telegram.org/bot${chatToken}/sendMessage`;

      const message =
        `🤖 *Bot Telegram đã được thêm vào Website!*\n\n` +
        `🌍 *Website:* ${siteName}\n` +
        `✅ Bot hiện có thể gửi thông báo và hỗ trợ các chức năng liên quan.\n\n` +
        `📌 Nếu bạn cần trợ giúp, vui lòng kiểm tra cấu hình hoặc liên hệ quản trị viên.`;

      const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.ok) {
        console.error('❌ Lỗi khi gửi thông báo:', data);
        return { success: false, error: data.description };
      }

      console.log('✅ Thông báo đã được gửi:', data);
      return { success: true, result: data.result };
    } catch (error) {
      console.error('🚨 Lỗi khi kết nối với Telegram API:', error);
      return { success: false, error: error.message };
    }
  }

  async sendMessageWithPost(
    chatId: string,
    botToken: string,
    post: Post,
    categories?: { name: string; slug: string }[],
  ) {
    if (!chatId || !botToken) {
      console.error('🚨 TELE_CHAT_ID is missing! Please check your .env file.');
      return;
    }

    const { buttons, message } = this.generateTelegramMessage(post, categories);

    try {
      const payload: any = {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      };

      if (buttons) {
        payload.reply_markup = {
          inline_keyboard: buttons,
        };
      }

      const response = await fetch(
        `${this.telegramApiUrl}/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

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

  async editMessageWithPost(
    chatId: string,
    messageId: number,
    botToken: string,
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

    const response = await fetch(
      `${this.telegramApiUrl}/bot${botToken}/editMessageText`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();
    if (!data.ok) {
      console.error('⚠️ Failed to edit message:', data);
    }
  }

  async getChatInfo(teleToken: string) {
    try {
      const chatId = await this.getChatIdFromUpdates(teleToken);
      const botInfo = await this.getBotInfo(teleToken);
      return {
        chatId,
        botId: botInfo.botId,
        botName: botInfo.botName,
        botUsername: botInfo.botUsername,
      };
    } catch (error) {
      console.error('❌ Lỗi khi lấy chat_id từ Telegram:', error.message);
      return null;
    }
  }

  async getBotInfo(teleToken: string) {
    try {
      const url = `https://api.telegram.org/bot${teleToken}/getMe`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.ok) {
        console.log('✅ Bot Info:', data.result);
        return {
          botId: data.result.id,
          botName: data.result.first_name, // Tên bot
          botUsername: data.result.username, // Username của bot (có @ phía trước)
          canJoinGroups: data.result.can_join_groups, // Có thể tham gia group không
          canReadMessages: data.result.can_read_all_group_messages, // Có thể đọc tin nhắn nhóm không
          supportsInline: data.result.supports_inline_queries, // Có hỗ trợ inline query không
        };
      } else {
        console.error('❌ Lỗi khi lấy thông tin bot:', data);
        return null;
      }
    } catch (error) {
      console.error('🚨 Telegram API Error:', error.message);
      return null;
    }
  }
  async getChatIdFromUpdates(teleToken: string): Promise<string | null> {
    try {
      const url = `https://api.telegram.org/bot${teleToken}/getUpdates`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.ok && data.result.length > 0) {
        const chatId = data.result[data.result.length - 1]?.message?.chat?.id;
        return chatId ? chatId.toString() : null;
      }

      console.error('❌ Không tìm thấy chat_id');
      return null;
    } catch (error) {
      console.error('❌ Lỗi khi gọi Telegram API:', error.message);
      return null;
    }
  }

  generateTelegramMessage(
    savedPost: Post,
    categories: { name: string; slug: string }[],
  ) {
    const categoryButtons = [];
    const chunkSize = 3;

    const selectedCategories = savedPost.categories?.map((c) => c.slug) || [];

    for (let i = 0; i < categories.length; i += chunkSize) {
      const row = categories.slice(i, i + chunkSize).map((cat) => ({
        text: `${selectedCategories.includes(cat.slug) ? '✅' : ''} ${cat.name}`,
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
        ],
        [
          {
            text: '👀 Xem',
            url: `https://admin.ck-tech.asia/blog/${savedPost.slug}`,
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
        ],
        [
          {
            text: '👀 Xem',
            url: `https://admin.ck-tech.asia/blog/${savedPost.slug}`,
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
