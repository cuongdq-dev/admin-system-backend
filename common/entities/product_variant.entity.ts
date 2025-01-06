import { ApiProperty } from '@nestjs/swagger';
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
import type { CartItem } from './cart_item.entity';
import type { Product } from './product.entity';
import type { ProductVariantMedia } from './product_variant_media.entity';

@Entity({ name: 'product_variants' })
@Unique(['id'])
export class ProductVariant extends BaseEntity {
  @ApiProperty({ example: 'Metadata' })
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @ApiProperty({ example: 'Product Id' })
  @Column({ type: 'uuid' })
  product_id: string;

  @ManyToOne('Product', 'variants')
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @OneToMany('ProductVariantMedia', 'variant')
  media: Relation<ProductVariantMedia>;

  @OneToMany('CartItem', 'variant')
  cartItems: Relation<CartItem>;

  @ApiProperty({ example: 'Price' })
  @Column({ type: 'decimal' })
  price: number;

  @ApiProperty({ example: 'Rank' })
  @Column({ type: 'integer', default: 1 })
  rank: number;
}
