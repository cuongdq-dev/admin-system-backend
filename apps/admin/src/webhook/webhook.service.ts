import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, Category } from '@app/entities';
import { TelegramService } from '@app/modules/telegram/telegram.service';
import { PostStatus } from '@app/entities/post.entity';

@Injectable()
export class WebhookService {
  private readonly botToken = process.env.TELE_BOT_TOKEN;

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly telegramService: TelegramService,
  ) {}

  async processCallback(callbackData: any) {
    const { callback_query } = callbackData;
    if (!callback_query) return;
    const categories = await this.categoryRepository.find();

    const chatId = callback_query.message.chat.id;
    const messageId = callback_query.message.message_id;
    const data = callback_query.data;

    console.log(`📥 Received Telegram callback: ${data}`);

    if (data.startsWith('cat_')) {
      await this.handleCategorySelection(chatId, messageId, data, categories);
    } else if (data.startsWith('public_')) {
      await this.handlePublishPost(chatId, messageId, data, categories);
    } else if (data.startsWith('delete_')) {
      await this.handleDeletePost(chatId, messageId, data, categories);
    } else if (data.startsWith('draft_')) {
      await this.handleDraftPost(chatId, messageId, data, categories);
    }
  }

  private async handleCategorySelection(
    chatId: number,
    messageId: number,
    data: string,
    categories: Category[],
  ) {
    const [_, postId, categorySlug] = data.split('_');

    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['categories'],
    });
    const category = await this.categoryRepository.findOne({
      where: { slug: categorySlug },
    });

    if (!post || !category) {
      console.warn(`⚠️ Không tìm thấy bài viết hoặc danh mục`);
      return;
    }

    post.categories = [category]; // Cập nhật danh mục
    const savePost = await this.postRepository.save(post);

    await this.telegramService.editMessageWithPost(
      chatId,
      messageId,
      this.botToken,
      savePost,
      categories,
    );
  }

  private async handlePublishPost(
    chatId: number,
    messageId: number,
    data: string,
    categories: Category[],
  ) {
    const [_, postId] = data.split('_');
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['categories'],
    });

    if (!post) {
      console.warn(`⚠️ Không tìm thấy bài viết`);
      return;
    }

    post.status = PostStatus.PUBLISHED;
    const savedPost = await this.postRepository.save(post);

    await this.telegramService.editMessageWithPost(
      chatId,
      messageId,
      this.botToken,
      savedPost,
      categories,
    );
  }

  private async handleDeletePost(
    chatId: number,
    messageId: number,
    data: string,
    categories: Category[],
  ) {
    const [_, postId] = data.split('_');
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['categories'],
    });

    if (!post) {
      console.warn(`⚠️ Không tìm thấy bài viết`);
      return;
    }

    const savedPost = await this.postRepository.save({
      id: post.id,
      status: PostStatus.DELETED,
    });
    await this.postRepository.softDelete(post.id);

    await this.telegramService.editMessageWithPost(
      chatId,
      messageId,
      this.botToken,
      savedPost,
      categories,
    );
  }

  private async handleDraftPost(
    chatId: number,
    messageId: number,
    data: string,
    categories: Category[],
  ) {
    const [_, postId] = data.split('_');
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['categories'],
    });
    if (!post) {
      console.warn(`⚠️ Không tìm thấy bài viết`);
      return;
    }

    post.status = PostStatus.DRAFT;
    const savedPost = await this.postRepository.save(post);
    await this.telegramService.editMessageWithPost(
      chatId,
      messageId,
      this.botToken,
      savedPost,
      categories,
    );
  }
}
