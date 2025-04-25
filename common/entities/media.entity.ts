import { Column, Entity, OneToMany, Relation, Unique } from 'typeorm';
import { BaseEntity } from './base';
import { Post } from './post.entity';
import { ProductVariantMedia } from './product_variant_media.entity';
import { Trending } from './trending.entity';
import { TrendingArticle } from './trending_articles.entity';
import { User } from './user.entity';

export enum StorageType {
  LOCAL = 'LOCAL',
  S3 = 'S3',
  BASE64 = 'BASE64',
  URL = 'URL',
}
@Entity({ name: 'media' })
@Unique(['slug'])
export class Media extends BaseEntity {
  @Column({ type: 'varchar', length: 500 })
  slug: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filename: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string;

  @Column({ type: 'text', nullable: true })
  data: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  mimetype: string;

  @Column({ type: 'enum', enum: StorageType, default: StorageType.LOCAL })
  storage_type: StorageType;

  @Column({ type: 'int', nullable: true })
  size: number;

  @OneToMany(() => User, (user) => user.avatar)
  avatars: Relation<User>;

  @OneToMany(() => User, (user) => user.banner)
  banners: Relation<User>;

  @OneToMany(() => Trending, (trending) => trending.thumbnail_id)
  trendings: Relation<Trending>;

  @OneToMany(() => TrendingArticle, (article) => article.thumbnail_id)
  articles: Relation<TrendingArticle>;

  @OneToMany(() => Post, (post) => post.thumbnail_id)
  posts: Relation<Post>;

  @OneToMany(() => ProductVariantMedia, (variant) => variant.media)
  variants: Relation<ProductVariantMedia>;
}
