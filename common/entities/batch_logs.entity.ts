import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base';

export type BatchLogStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'died';
@Entity({ name: 'batch_logs' })
export class BatchLogs extends BaseEntity {
  @Column()
  job_name: string;

  @Column()
  job_source: string; // ví dụ: "cron" | "manual" | "retry"

  @Column({ nullable: true })
  scheduled_at: Date;

  @Column({ nullable: true })
  started_at: Date;

  @Column({ nullable: true })
  finished_at: Date;

  @Column({ default: 'pending' })
  status: BatchLogStatus;

  @Column({ type: 'text', array: true, nullable: true })
  message: string[];
}
