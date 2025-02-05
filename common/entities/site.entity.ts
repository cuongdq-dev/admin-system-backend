import { IsOptional } from 'class-validator';
import { ValidationGroup } from '@app/crud/validation-group';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  Relation,
} from 'typeorm';
import { BaseEntity } from './base';
import { Category } from './category.entity';
import { Post } from './post.entity';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

@Entity({ name: 'sites' })
export class Site extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  domain: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  description: string;

  @ManyToMany(() => Post, (post) => post.sites, { cascade: true })
  @JoinTable({
    name: 'site_posts',
    joinColumn: { name: 'site_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'post_id', referencedColumnName: 'id' },
  })
  posts: Relation<Post[]>;

  @ManyToMany(() => Category, (category) => category.sites, { cascade: true })
  @JoinTable({
    name: 'site_categories',
    joinColumn: { name: 'site_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Relation<Category[]>;

  @Column({ type: 'varchar', length: 100, unique: true })
  token: string;

  @BeforeInsert()
  async generateToken() {
    this.token = `${randomStringGenerator()}-${randomStringGenerator()}`;
  }
}
