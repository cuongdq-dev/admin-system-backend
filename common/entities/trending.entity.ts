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
import { TrendingArticle } from './trending_articles.entity';

@Entity({ name: 'trending' })
@Unique(['titleQuery'])
export class Trending extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  titleQuery: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  formattedTraffic: string;

  @Column({ type: 'jsonb', nullable: true })
  relatedQueries: { query?: string }[];

  @ManyToOne(() => Media, { nullable: true })
  @JoinColumn({ name: 'thumbnail_id' })
  thumbnail: Relation<Media>;

  @Column({ type: 'uuid', nullable: true })
  thumbnail_id: string;

  @OneToMany(() => TrendingArticle, (article) => article.trending)
  articles: Relation<TrendingArticle>[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  trendDate: string;
}
