// src/common/services/batch-log.service.ts

import { BatchLogs } from '@app/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class BatchLogsService {
  constructor(
    @InjectRepository(BatchLogs)
    private readonly batchLogRepo: Repository<BatchLogs>,
  ) {}

  async create(jobName: string, scheduledAt: Date = new Date()) {
    const log = this.batchLogRepo.create({
      job_name: jobName,
      scheduled_at: scheduledAt,
      status: 'pending',
      job_source: 'cron',
    });
    return this.batchLogRepo.save(log);
  }

  async start(logId: string): Promise<void> {
    await this.batchLogRepo.update(logId, {
      started_at: new Date(),
      status: 'running',
    });
  }

  async success(logId: string, messages: string[]): Promise<void> {
    await this.batchLogRepo.update(logId, {
      finished_at: new Date(),
      status: 'success',
      message: messages,
    });
  }

  async fail(
    logId: string,
    errorMessage: string,
    messages: string[],
  ): Promise<void> {
    await this.batchLogRepo.update(logId, {
      finished_at: new Date(),
      status: 'failed',
      message: [...messages, `Error: ${errorMessage}`],
    });
  }

  async get(logId: string) {
    return this.batchLogRepo.findOne({ where: { id: logId } });
  }
}
