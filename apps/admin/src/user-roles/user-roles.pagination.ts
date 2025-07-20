import { Role } from '@app/entities';
import { PaginateConfig } from 'nestjs-paginate';

export const rolesPaginateConfig: PaginateConfig<Role> = {
  relations: ['user_roles', 'role_permissions'],
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  maxLimit: 1000,
  defaultLimit: 50,
  filterableColumns: {},
};
