import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaService } from './media.service';
import { Media } from '@app/entities';
import { MediaController } from './media.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Media])],
  providers: [MediaService],
  exports: [MediaService],
  controllers: [MediaController],
})
export class MediaModule {}
