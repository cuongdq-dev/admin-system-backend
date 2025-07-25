import { Category, Post, Site } from '@app/entities';
import { PostStatus } from '@app/entities/post.entity';
// import { TelegramService } from '@app/modules/telegram/telegram.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    // private readonly telegramService: TelegramService,
  ) {}

  private readonly botToken = process.env.TELE_BOT_TOKEN;
  private readonly chatId = process.env.TELE_BOT_CHAT_ID;

  async processCallback(callbackData: any) {
    const { callback_query } = callbackData;
    if (!callback_query) return;

    const site = await this.siteRepository.findOne({
      where: { teleChatId: callback_query.message.chat_id },
      relations: ['categories'],
      select: ['id', 'categories', 'teleBotName', 'teleChatId', 'teleToken'],
    });

    const categories = site?.id
      ? await this.categoryRepository.find({
          where: { sites: { id: site?.id } },
          relations: ['sites'],
        })
      : await this.categoryRepository.find();

    const chatId = site?.teleChatId || this.chatId;
    const botToken = site?.teleToken || this.botToken;

    const messageId = callback_query.message.message_id;
    const data = callback_query.data;

    console.log(`📥 Received Telegram callback: ${data}`);

    if (data.startsWith('cat_')) {
      await this.handleCategorySelection(
        messageId,
        data,
        categories,
        chatId,
        botToken,
      );
    } else if (data.startsWith('public_')) {
      await this.handlePublishPost(
        messageId,
        data,
        categories,
        chatId,
        botToken,
      );
    } else if (data.startsWith('delete_')) {
      await this.handleDeletePost(
        messageId,
        data,
        categories,
        chatId,
        botToken,
      );
    } else if (data.startsWith('draft_')) {
      await this.handleDraftPost(messageId, data, categories, chatId, botToken);
    }
  }

  private async handleCategorySelection(
    messageId: number,
    data: string,
    categories: Category[],
    chatId: string,
    chatBotToken: string,
  ) {
    const [, postId, categorySlug] = data.split('_');

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

    // if (!!post.categories.find((cate) => cate.id == category.id)) {
    //   await this.telegramService.editMessageWithPost(
    //     chatId,
    //     messageId,
    //     chatBotToken,
    //     post,
    //     categories,
    //   );
    //   return;
    // }
    // post.categories = [category]; // Cập nhật danh mục
    // const savePost = await this.postRepository.save(post);

    // await this.telegramService.editMessageWithPost(
    //   chatId,
    //   messageId,
    //   chatBotToken,
    //   savePost,
    //   categories,
    // );
  }

  private async handlePublishPost(
    messageId: number,
    data: string,
    categories: Category[],
    chatId: string,
    chatBotToken: string,
  ) {
    const [, postId] = data.split('_');
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

    // await this.telegramService.editMessageWithPost(
    //   chatId,
    //   messageId,
    //   chatBotToken,
    //   savedPost,
    //   categories,
    // );
  }

  private async handleDeletePost(
    messageId: number,
    data: string,
    categories: Category[],
    chatId: string,
    chatBotToken: string,
  ) {
    const [, postId] = data.split('_');
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

    // await this.telegramService.editMessageWithPost(
    //   chatId,
    //   messageId,
    //   chatBotToken,
    //   savedPost,
    //   categories,
    // );
  }

  private async handleDraftPost(
    messageId: number,
    data: string,
    categories: Category[],
    chatId: string,
    chatBotToken: string,
  ) {
    const [, postId] = data.split('_');
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
    // await this.telegramService.editMessageWithPost(
    //   chatId,
    //   messageId,
    //   chatBotToken,
    //   savedPost,
    //   categories,
    // );
  }
}
