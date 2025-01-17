import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { BaseEntity } from './base';
import { Media } from './media.entity';
import { PostCategory } from './post_category.entity';
import { TrendingArticle } from './trending_articles.entity';
import type { User } from './user.entity';
import { IsOptional } from 'class-validator';
import { ValidationGroup } from 'common/crud';

export enum PostStatus {
  NEW = 'NEW',
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DELETED = 'DELETED',
}

@Entity({ name: 'posts' })
export class Post extends BaseEntity {
  @Column({ type: 'boolean', default: false })
  is_published: boolean;

  @ManyToOne(() => TrendingArticle, (article) => article.posts, {
    nullable: true,
  })
  @JoinColumn({ name: 'article_id' })
  article: Relation<TrendingArticle>;

  @Column({ type: 'uuid', nullable: true })
  article_id: string;

  @ManyToOne(() => PostCategory, (category) => category.posts, {
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Relation<PostCategory>;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  category_id: string;

  @ManyToOne(() => Media, { nullable: true })
  @JoinColumn({ name: 'thumbnail_id' })
  thumbnail: Relation<Media>;

  @Column({ type: 'uuid', nullable: true })
  thumbnail_id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  title: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  relatedQueries: { query?: string }[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  meta_description: string;

  @ManyToOne('User', 'posts')
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @ApiProperty()
  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.NEW })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  status: PostStatus;
}
