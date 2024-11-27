import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LangContent } from 'common/entities/lang_content.entity';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { i18nPaginateConfig } from './i18n.pagination';
import { Lang } from 'common/entities/lang.entity';
import { I18nUpdateDto } from './i18n.dto';

@Injectable()
export class I18nService {
  constructor(
    @InjectRepository(LangContent)
    private langContentRepository: Repository<LangContent>,
    @InjectRepository(Lang)
    private langRepository: Repository<Lang>,
  ) {}

  async getJson() {
    const langs = await this.langRepository.find();
    const contents = await this.langContentRepository.find();
    const result: Record<string, Record<string, string>> = {};
    langs.forEach((lang) => {
      result[lang.code.toLowerCase()] = {};
    });

    contents.forEach((content) => {
      const langCode = langs
        .find((lang) => lang.id === content.lang_id)
        ?.code.toLowerCase();
      if (langCode) {
        result[langCode][content.code] = content.content;
      }
    });

    return result;
  }

  async getCodeI18n() {
    return this.langRepository.find();
  }

  async getLang(query: PaginateQuery, lang?: string) {
    const where = lang ? { lang: { code: lang } } : undefined;

    return paginate(
      { ...query, filter: { ...query.filter } },
      this.langContentRepository,
      { ...i18nPaginateConfig, where },
    );
  }
  async UpdateLang(id: string, body: I18nUpdateDto) {
    await this.langContentRepository.update(id, body);
    return this.langContentRepository.findOne({ where: { id } });
  }
}
