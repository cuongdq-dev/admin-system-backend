import { Column, Entity, OneToMany, Relation } from 'typeorm';
import { BaseEntity } from './base';
import { Post } from './post.entity';

@Entity({ name: 'categories' })
export class PostCategory extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany('Post', 'category')
  posts: Relation<Post[]>;
}
