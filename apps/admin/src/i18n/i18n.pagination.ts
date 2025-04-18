import { LangContent } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const i18nPaginateConfig: PaginateConfig<LangContent> = {
  relations: ['lang'],
  sortableColumns: ['created_at', 'code', 'content'],
  defaultSortBy: [['created_at', 'DESC']],
  searchableColumns: ['code', 'content'],
  maxLimit: 500,
  defaultLimit: 100,
  filterableColumns: { title: [FilterOperator.EQ] },
};
