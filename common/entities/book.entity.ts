import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';
import { BaseEntity } from './base';
import { Chapter } from './book_chapter.entity';
import { Category } from './category.entity';
import { Media } from './media.entity';
import { SiteBook } from './site_books.entity';
import { User } from './user.entity';

export enum BookStatus {
  NEW = 'NEW',
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CRAWLER = 'CRAWLER',
  DELETED = 'DELETED',
  AI_GENERATE = 'AI_GENERATE',
}

export enum VideoStatus {
  NEW = 'NEW',
  AI_GENERATE = 'AI_GENERATE',
  VOICE = 'VOICE',
  RENDERED = 'RENDERED',
}

@Entity({ name: 'books' })
@Index(['slug', 'title'], { unique: true }) // Đảm bảo không có trùng lặp
export class Book extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  title: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  slug: string;

  @Column({ nullable: true, type: 'text' })
  content: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  meta_description: string;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  keywords: { query?: string; slug?: string }[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'::jsonb" })
  author: { slug?: string; name?: string };

  @Column({ nullable: true, default: true })
  is_new: boolean;

  @Column({ nullable: true, default: false })
  is_full: boolean;

  @Column({ nullable: true, default: false })
  is_hot: boolean;

  @Column({ nullable: true, type: 'text' })
  source_url: string;

  @Column({ nullable: true, default: 0 })
  total_chapter: number;

  @OneToMany(() => Chapter, (chapter) => chapter.book)
  chapters: Relation<Chapter[]>;

  @Column({ type: 'enum', enum: BookStatus, default: BookStatus.NEW })
  @Index()
  status: BookStatus;
  //
  @ManyToOne(() => Media, (thumbnail) => thumbnail.books, {
    nullable: true,
    eager: false,
    onDelete: 'SET NULL',
  })
  @IsOptional()
  @JoinColumn({ name: 'thumbnail_id' })
  thumbnail: Relation<Media>;

  @Column({ type: 'uuid', nullable: true })
  thumbnail_id: string;

  @ManyToOne(() => User, (user) => user.books, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @IsOptional()
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @ApiProperty()
  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  @ManyToMany(() => Category, (category) => category.books)
  categories: Relation<Category[]>;

  @OneToMany(() => SiteBook, (siteBook) => siteBook.book)
  siteBooks: Relation<SiteBook[]>;

  @Column({ nullable: true, type: 'text' })
  youtube_url: string;

  @Column({ nullable: true, type: 'text' })
  tiktok_url: string;

  @Column({ nullable: true, type: 'text' })
  facebook_url: string;

  @Column({ nullable: true, type: 'int', default: 0 })
  word_count: number;

  @Column({ nullable: true, type: 'int', default: 0 })
  voice_count: number;

  @Column({ nullable: true, type: 'boolean', default: false })
  is_ai_generate: boolean;

  @Column({ type: 'enum', enum: VideoStatus, default: VideoStatus.NEW })
  @Index()
  video_status: VideoStatus;
}
