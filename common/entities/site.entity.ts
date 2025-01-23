import { Column, Entity, ManyToMany, OneToMany, Relation } from 'typeorm';
import { BaseEntity } from './base';
import { Post } from './post.entity';
import { IsOptional } from 'class-validator';
import { ValidationGroup } from 'common/crud';

@Entity({ name: 'categories' })
export class PostCategory extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  slug: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  description: string;

  @ManyToMany(() => Post, (post) => post.categories)
  posts: Relation<Post[]>;
}
