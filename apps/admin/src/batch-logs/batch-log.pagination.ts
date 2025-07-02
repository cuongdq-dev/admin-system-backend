import { BatchLogs } from '@app/entities';
import { PaginateConfig } from 'nestjs-paginate';

export const batchLogsPaginateConfig: PaginateConfig<BatchLogs> = {
  relations: [],
  sortableColumns: ['created_at'],
  defaultSortBy: [['created_at', 'DESC']],
  maxLimit: 1000,
  defaultLimit: 50,
  select: [
    'id',
    'created_at',
    'scheduled_at',
    'finished_at',
    'started_at',
    'status',
    'job_name',
    'message',
    'job_source',
  ],
  filterableColumns: {},
};
