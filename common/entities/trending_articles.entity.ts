import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base';
import { Media } from './media.entity';
import { Post } from './post.entity';
import { Trending } from './trending.entity';

@Entity({ name: 'trending_article' })
@Unique(['url', 'title'])
export class TrendingArticle extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'varchar', length: 150 })
  source: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @ManyToOne(() => Trending, (trending) => trending.articles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trending_id' })
  trending: Relation<Trending>;

  @Column({ type: 'uuid', nullable: false })
  trending_id: string;

  @ManyToOne(() => Media, { nullable: true })
  @JoinColumn({ name: 'thumbnail_id' })
  thumbnail: Relation<Media>;

  @Column({ type: 'uuid', nullable: true })
  thumbnail_id: string;

  @Column({ type: 'jsonb', nullable: true })
  relatedQueries: { query?: string }[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  meta_description: string;

  @OneToMany(() => Post, (post) => post.article)
  posts: Relation<Post>[];
}
