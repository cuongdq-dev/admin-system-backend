import { Lang, LangContent } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nController } from './i18n.controller';
import { I18nService } from './i18n.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LangContent]),
    TypeOrmModule.forFeature([Lang]),
  ],
  providers: [I18nService],
  controllers: [I18nController],
})
export class I18nModule {}
