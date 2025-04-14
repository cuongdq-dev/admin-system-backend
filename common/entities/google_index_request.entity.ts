import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
} from 'typeorm';
import { Post, Site } from '.';

@Entity('google_index_requests')
@Unique(['post_slug', 'type'])
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

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'text' })
  googleUrl: string;

  @Column({ type: 'text', nullable: true })
  type: string;

  @CreateDateColumn({ type: 'timestamp' })
  requested_at: Date;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  response: any;

  @ManyToOne(() => Post, { eager: false })
  @JoinColumn({ name: 'post_id' })
  post: Relation<Post>;

  @ManyToOne(() => Site, { eager: false })
  @JoinColumn({ name: 'site_id' })
  site: Relation<Site>;
}
