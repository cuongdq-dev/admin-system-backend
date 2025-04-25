// media.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Media, StorageType, User } from '@app/entities';
import { generateSlug, uploadImageCdn } from '@app/utils';
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
}
