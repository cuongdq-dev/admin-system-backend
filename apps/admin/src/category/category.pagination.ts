import { PostCategory } from '@app/entities';
import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

export const categoryPaginateConfig: PaginateConfig<PostCategory> = {
  relations: ['posts'],
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  maxLimit: 100,
  defaultLimit: 20,
  filterableColumns: { title: [FilterOperator.EQ] },
};
