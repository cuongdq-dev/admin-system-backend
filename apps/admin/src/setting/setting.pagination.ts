import { Notification } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const NotificationPaginateConfig: PaginateConfig<Notification> = {
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  maxLimit: 100,
  defaultLimit: 20,
  filterableColumns: { title: [FilterOperator.EQ] },
};
