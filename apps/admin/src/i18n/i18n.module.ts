import { Module } from '@nestjs/common';
import { I18nController } from './i18n.controller';
import { I18nService } from './i18n.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lang } from 'common/entities/lang.entity';
import { LangContent } from 'common/entities/lang_content.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LangContent]),
    TypeOrmModule.forFeature([Lang]),
  ],
  providers: [I18nService],
  controllers: [I18nController],
})
export class I18nModule {}
