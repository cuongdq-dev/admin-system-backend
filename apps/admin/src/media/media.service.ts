// media.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Media, StorageType, User } from '@app/entities';
import {
  generateSlug,
  getListCdn,
  uploadImageCdn,
  workspaceEnum,
} from '@app/utils';
import { Repository } from 'typeorm';
import * as path from 'path';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  async uploadMedia(file: Express.Multer.File, user?: User) {
    const base64Image = file.buffer.toString('base64');
    const mediaEntity = {
      data: `data:image/png;base64, ${base64Image}`,
      filename: file.originalname,
      slug: generateSlug(path.parse(file.originalname).name),
      mimetype: file.mimetype,
      size: file.size,
      storage_type: StorageType.BASE64,
      url: '',
    };

    const cdnResult = await uploadImageCdn(mediaEntity);

    if (!!cdnResult.url) {
      mediaEntity.url = process.env.CDN_DOMAIN + cdnResult?.url;
      mediaEntity.storage_type = StorageType.LOCAL;
      mediaEntity.data = null;
    }

    const thumbnailResult = await this.mediaRepository.upsert(
      { ...mediaEntity, deleted_at: null, deleted_by: null },
      { conflictPaths: ['slug'] },
    );

    return this.mediaRepository.findOne({
      where: { id: thumbnailResult.generatedMaps[0]?.id },
    });
  }

  async getMedia(slug: string) {
    const result = await this.mediaRepository
      .createQueryBuilder('media')
      .leftJoinAndSelect('media.banners', 'banners')
      .leftJoinAndSelect('media.avatars', 'avatars')
      .leftJoinAndSelect('media.posts', 'posts')
      .leftJoinAndSelect('media.articles', 'articles')
      .leftJoinAndSelect('media.trendings', 'trendings')
      .where('media.slug = :slug', { slug })
      .select([
        'media.id',
        'media.slug',
        'media.filename',
        'media.size',
        'media.created_at',
        'media.url',
        'media.storage_type',

        'posts.id',
        'posts.title',
        'posts.slug',

        'banners.id',
        'banners.name',
        'banners.email',

        'trendings.id',
        'trendings.titleQuery',

        'articles.id',
        'articles.slug',

        'avatars.id',
        'avatars.name',
        'avatars.email',
      ])
      .getOne();

    return result;
  }

  async getAllMedia({ workspaces }: { workspaces: string }) {
    const queryDB = this.mediaRepository
      .createQueryBuilder('media')
      .select(['media.url AS url', 'media.slug AS filename']);

    if (workspaces == 'wp_system') {
      queryDB
        .leftJoin('media.avatars', 'avatar')
        .leftJoin('media.banners', 'banner')
        .andWhere('(avatar.id is NOT NULL OR banner.id is NOT NULL)');
    }

    if (workspaces == 'wp_books') {
      queryDB.leftJoin('media.books', 'book').andWhere('(book.id IS NOT NULL)');
    }

    if (workspaces == 'wp_news') {
      queryDB
        .leftJoin('media.posts', 'post')
        .leftJoin('media.articles', 'article')
        .leftJoin('media.trendings', 'trending')
        .andWhere(
          '(post.id IS NOT NULL OR article.id IS NOT NULL OR trending.id IS NOT NULL)',
        );
    }

    const result = await queryDB.getRawMany();
    return {
      data: result,
      totalRecords: result?.length ?? 0,
    };
  }
}
