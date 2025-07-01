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
import { Book, Chapter, Site } from '.';

@Entity('google_index_book_requests')
@Unique(['book_slug', 'type'])
export class GoogleIndexBookRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' }) // Cột ID của Book
  book_id: string;

  @Column({ type: 'uuid' }) // Cột ID của Book
  site_id: string;

  @Column({ type: 'text' })
  site_domain: string;

  @Column({ type: 'text' })
  book_slug: string;

  @Column({ type: 'uuid', nullable: true }) // Cột ID của Chapter
  chapter_id: string;

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

  @ManyToOne(() => Book, { eager: false, cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Relation<Book>;

  @ManyToOne(() => Chapter, {
    eager: false,
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Relation<Chapter>;

  @ManyToOne(() => Site, { eager: false, cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: Relation<Site>;
}
