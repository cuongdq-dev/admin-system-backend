import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('google_index_requests')
export class GoogleIndexRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' }) // Cột ID của Post
  post_id: string;

  @Column({ type: 'uuid' }) // Cột ID của Post
  site_id: string;

  @Column({ type: 'text' })
  site_domain: string;

  @Column({ type: 'text' })
  post_slug: string;

  @Column({ type: 'text', unique: true })
  url: string;

  @Column({ type: 'text' })
  googleUrl: string;

  @Column({ type: 'text', nullable: true })
  type: string;

  @CreateDateColumn({ type: 'timestamp' })
  requested_at: Date;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  response: any;
}
