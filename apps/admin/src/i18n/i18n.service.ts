import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LangContent } from 'common/entities/lang_content.entity';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { i18nPaginateConfig } from './i18n.pagination';
import { Lang } from 'common/entities/lang.entity';

@Injectable()
export class I18nService {
  constructor(
    @InjectRepository(LangContent)
    private langContentRepository: Repository<LangContent>,
    @InjectRepository(Lang)
    private langRepository: Repository<Lang>,
  ) {}

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
  async UpdateLang() {
    return true;
  }
}
