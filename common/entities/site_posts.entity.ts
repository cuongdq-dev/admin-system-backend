import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
} from 'typeorm';
import { BaseEntity } from './base';
import { Post } from './post.entity';
import { Site } from './site.entity';

export enum IndexStatus {
  NEW = 'NEW',
  INDEXING = 'INDEXING',
  DELETED = 'DELETED',
  // FROM DOCUMENT
  VERDICT_UNSPECIFIED = 'VERDICT_UNSPECIFIED',
  PASS = 'PASS',
  PARTIAL = 'PARTIAL',
  FAIL = 'FAIL',
  NEUTRAL = 'NEUTRAL',
}

@Entity({ name: 'site_posts' })
@Index(['site_id', 'post_id'], { unique: true }) // Đảm bảo không có trùng lặp
export class SitePost extends BaseEntity {
  @Column({ type: 'uuid' }) // Cột ID của Site
  site_id: string;

  @Column({ type: 'uuid' }) // Cột ID của Post
  post_id: string;

  @ManyToOne(() => Site, (site) => site.sitePosts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: Relation<Site>;

  @ManyToOne(() => Post, (post) => post.sitePosts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Relation<Post>;

  @Column({ type: 'enum', enum: IndexStatus, default: IndexStatus.NEW })
  @Index()
  indexStatus: IndexStatus;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  indexState: Record<string, any>;
}
