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

@Entity({ name: 'chapters' })
@Index(['slug', 'title', 'book_id'], { unique: true }) // Đảm bảo không có trùng lặp
export class Chapter extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Index()
  title: string;

  @Column({ type: 'text', nullable: true })
  meta_description: string;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  keywords: { query?: string; slug?: string }[];

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'int', nullable: true })
  @Index()
  chapter_number: number;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true, type: 'text' })
  voice_content: string;

  @Column({ type: 'boolean', default: false })
  is_published: boolean;

  @ManyToOne(() => Book, (book) => book.chapters, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'book_id' })
  book: Relation<Book>;

  @Column({ type: 'uuid' })
  book_id: string;

  @Column({ nullable: true, type: 'text' })
  source_url: string;
}
