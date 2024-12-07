import { ProductVariant } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const productVariantPaginateConfig: PaginateConfig<ProductVariant> = {
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  relations: ['media'],
  maxLimit: 50,
  defaultLimit: 10,
  filterableColumns: {
    id: [FilterOperator.IN],
    product_id: [FilterOperator.IN, FilterOperator.EQ],
    price: [FilterOperator.EQ],
  },
};
