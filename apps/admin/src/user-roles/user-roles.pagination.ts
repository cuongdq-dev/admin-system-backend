import { Role } from '@app/entities';
import { PaginateConfig } from 'nestjs-paginate';

export const userRolesPaginateConfig: PaginateConfig<Role> = {
  relations: ['users', 'permissions'],
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  maxLimit: 1000,
  defaultLimit: 50,
  filterableColumns: {},
};
