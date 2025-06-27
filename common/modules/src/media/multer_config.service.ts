import { StorageType } from '@app/entities';
import { S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express';
import * as multerS3 from 'multer-s3';
import * as path from 'path';

@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMulterOptions(): MulterModuleOptions {
    const storageType = this.configService.get('storage.type');
    const region = this.configService.get('storage.region');
    const workingDirectory = this.configService.get('app.workingDirectory');

    if (storageType === StorageType.S3) {
      const client = new S3Client({
        forcePathStyle: false,
        region,
        credentials: {
          accessKeyId: this.configService.get('storage.accessKeyId'),
          secretAccessKey: this.configService.get('storage.secretAccessKey'),
        },
      });

      return {
        storage: multerS3({
          contentType: multerS3.AUTO_CONTENT_TYPE,
          s3: client,
          bucket: this.configService.get('storage.bucket'),
          key: function (_, file, cb) {
            cb(null, `${randomStringGenerator()}${file.originalname}`);
          },
        }),
      };
    } else {
      return {
        dest: path.join(workingDirectory, 'media'),
      };
    }
  }
}
