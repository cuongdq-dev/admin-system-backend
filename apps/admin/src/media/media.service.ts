// media.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Media, StorageType, User } from '@app/entities';
import { generateSlug, getListCdn, uploadImageCdn } from '@app/utils';
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

  async getAllMedia({
    storage_type = StorageType.LOCAL,
  }: {
    storage_type?: StorageType;
  }) {
    if (storage_type != StorageType.LOCAL) {
      const result = await this.mediaRepository.find({
        where: { storage_type: storage_type },
        select: ['url', 'slug'],
      });
      return {
        data: result.map((r) => {
          return { url: r.url, filename: r?.slug };
        }),
        totalRecords: result.length,
      };
    }
    const listCdn = await getListCdn();
    return {
      data: listCdn?.files.map((f) => {
        return { url: process.env.CDN_DOMAIN + f?.url, filename: f.name };
      }),
      totalRecords: listCdn?.files?.length,
    };
  }
}
