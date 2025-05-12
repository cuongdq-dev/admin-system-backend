import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  Relation,
} from 'typeorm';
import { BaseEntity } from './base';
import { Book } from './book.entity';
import { Post } from './post.entity';
import { Site } from './site.entity';

export enum CategoryType {
  POST = 'POST',
  BOOK = 'BOOK',
}
@Entity({ name: 'categories' })
export class Category extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Một category có thể có nhiều bài viết
  @ManyToMany(() => Post, (post) => post.categories, { cascade: true })
  @JoinTable({
    name: 'category_posts',
    joinColumn: { name: 'category_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'post_id', referencedColumnName: 'id' },
  })
  posts: Relation<Post[]>;

  // Một category có thể có nhiều book
  @ManyToMany(() => Book, (book) => book.categories, { cascade: true })
  @JoinTable({
    name: 'category_books',
    joinColumn: { name: 'category_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'book_id', referencedColumnName: 'id' },
  })
  books: Relation<Book[]>;

  // Một category có thể được sử dụng bởi nhiều site
  @ManyToMany(() => Site, (site) => site.categories)
  sites: Relation<Site[]>;

  @Column({ type: 'enum', enum: CategoryType, nullable: true })
  @Index()
  status: CategoryType;
}
