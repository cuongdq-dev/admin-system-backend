import { ValidationGroup } from '@app/crud/validation-group';
import { IsOptional } from 'class-validator';
import { Column, Entity, JoinTable, ManyToMany, Relation } from 'typeorm';
import { BaseEntity } from './base';
import { Post } from './post.entity';
import { Site } from './site.entity';

@Entity({ name: 'categories' })
export class Category extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  slug: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  description: string;

  @ManyToMany(() => Post, (post) => post.categories, { cascade: true })
  @JoinTable({
    name: 'category_posts',
    joinColumn: { name: 'category_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'post_id', referencedColumnName: 'id' },
  })
  posts: Relation<Post[]>;

  @ManyToMany(() => Site, (site) => site.categories)
  sites: Relation<Site[]>;
}
