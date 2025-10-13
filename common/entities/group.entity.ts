import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  BeforeUpdate,
  BeforeInsert,
} from 'typeorm';
import { GroupMember } from './group-member.entity';
import { Message } from './message.entity';
import { Bill } from './bill.entity';
import { BaseEntity } from './base';

import slugify from 'slugify';

@Entity('groups')
export class Group extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  avatar?: string;

  @OneToMany(() => GroupMember, (gm) => gm.group)
  members: GroupMember[];

  @OneToMany(() => Message, (m) => m.group)
  messages: Message[];

  @OneToMany(() => Bill, (b) => b.group)
  bills: Bill[];

  /**
   * Generate slug automatically before insert or update
   */
  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (this.name) {
      this.slug = slugify(this.name, {
        lower: true,
        strict: true,
        locale: 'vi', // hỗ trợ tiếng Việt nếu dùng slugify >= 1.6.6
      });
    }
  }
}
