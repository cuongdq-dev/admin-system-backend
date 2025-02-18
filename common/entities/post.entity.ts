import { ValidationGroup } from '@app/crud/validation-group';
import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  Relation,
} from 'typeorm';
import { BaseEntity } from './base';
import { Category } from './category.entity';
import { Media } from './media.entity';
import { Site } from './site.entity';
import { TrendingArticle } from './trending_articles.entity';
import type { User } from './user.entity';

export enum PostStatus {
  NEW = 'NEW',
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DELETED = 'DELETED',
}

@Entity({ name: 'posts' })
export class Post extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  title: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  relatedQueries: { query?: string }[];

  @Column({ type: 'text' })
  meta_description: string;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.NEW })
  @Index()
  status: PostStatus;

  // Quan hệ với bài báo trending (nullable)
  @ManyToOne(() => TrendingArticle, (article) => article.posts, {
    nullable: true,
  })
  @JoinColumn({ name: 'article_id' })
  article: Relation<TrendingArticle>;

  @Column({ type: 'uuid', nullable: true })
  article_id: string;

  // Quan hệ với thumbnail
  @ManyToOne(() => Media, { nullable: true })
  @JoinColumn({ name: 'thumbnail_id' })
  thumbnail: Relation<Media>;

  @Column({ type: 'uuid', nullable: true })
  thumbnail_id: string;

  // Quan hệ với người tạo bài viết
  @ManyToOne('User', 'posts')
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @ApiProperty()
  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  // Quan hệ với categories
  @ManyToMany(() => Category, (category) => category.posts)
  categories: Relation<Category[]>;

  // Quan hệ với sites
  @ManyToMany(() => Site, (site) => site.posts)
  sites: Relation<Site[]>;
}
