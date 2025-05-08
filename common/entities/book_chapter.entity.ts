import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { BaseEntity } from './base';
import { Book } from './book.entity';

@Entity({ name: 'chapters' })
export class Chapter extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'int' })
  chapter_number: number;

  @Column({ type: 'text' })
  content: string;

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
}
