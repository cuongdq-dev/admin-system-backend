import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
} from 'typeorm';
import { BaseEntity } from './base';
import { Book } from './book.entity';
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

@Entity({ name: 'site_books' })
@Index(['site_id', 'book_id'], { unique: true }) // Đảm bảo không có trùng lặp
export class SiteBook extends BaseEntity {
  @Column({ type: 'uuid' }) // Cột ID của Site
  site_id: string;

  @Column({ type: 'uuid' }) // Cột ID của Post
  book_id: string;

  @ManyToOne(() => Site, (site) => site.siteBooks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: Relation<Site>;

  @ManyToOne(() => Book, (book) => book.siteBooks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Relation<Book>;

  @Column({ type: 'enum', enum: IndexStatus, default: IndexStatus.NEW })
  @Index()
  indexStatus: IndexStatus;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  indexState: Record<string, any>;
}
