// src/common/services/batch-log.service.ts

import { BatchLogs, User } from '@app/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { batchLogsPaginateConfig } from './batch-log.pagination';

@Injectable()
export class BatchLogsService {
  constructor(
    @InjectRepository(BatchLogs)
    private readonly batchLogRepo: Repository<BatchLogs>,
  ) {}

  async getAll(query: PaginateQuery, user: User) {
    return await paginate(query, this.batchLogRepo, batchLogsPaginateConfig);
  }
}
