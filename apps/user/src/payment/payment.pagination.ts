import { Payment } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const paymentPaginateConfig: PaginateConfig<Payment> = {
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  maxLimit: 50,
  defaultLimit: 10,
  filterableColumns: {
    id: [FilterOperator.IN],
    order_id: [FilterOperator.IN, FilterOperator.EQ],
  },
};
