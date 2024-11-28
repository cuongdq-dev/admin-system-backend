import { Server } from 'common/entities/server.entity';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const serverPaginateConfig: PaginateConfig<Server> = {
  sortableColumns: ['created_at', 'name', 'user', 'host'],
  defaultSortBy: [['created_at', 'DESC']],
  searchableColumns: ['name', 'user', 'host'],
  maxLimit: 100,
  defaultLimit: 10,
  filterableColumns: { title: [FilterOperator.EQ] },
};
