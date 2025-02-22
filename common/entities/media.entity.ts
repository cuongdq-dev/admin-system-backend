import { Column, Entity, OneToMany, Relation, Unique } from 'typeorm';
import { BaseEntity } from './base';
import { ProductVariantMedia } from './product_variant_media.entity';
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

  @OneToMany(() => ProductVariantMedia, (variant) => variant.media)
  variants: Relation<ProductVariantMedia>;
}
