import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Lang } from 'common/entities/lang.entity';
import { LangContent } from 'common/entities/lang_content.entity';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { I18nUpdateDto } from './i18n.dto';
import { i18nPaginateConfig } from './i18n.pagination';
import { User } from 'common/entities/user.entity';

@Injectable()
export class I18nService {
  constructor(
    @InjectRepository(LangContent)
    private langContentRepository: Repository<LangContent>,
    @InjectRepository(Lang)
    private langRepository: Repository<Lang>,
  ) {}

  async getJson(lang: string) {
    const contents = await this.langContentRepository.find({
      where: { lang: { code: lang } },
      select: {},
    });
    const result = contents.reduce((acc, item) => {
      acc[item.code] = item.content; // Gán code là key và name là value
      return acc;
    }, {});

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
  async UpdateLang(id: string, body: I18nUpdateDto, user: User) {
    await this.langContentRepository.update(id, {
      ...body,
      updated_by: user.id,
    });
    return this.langContentRepository.findOne({ where: { id } });
  }
}
