import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';
import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base';
import type { Media } from './media.entity';
import { Notification } from './notification.entity';
import type { Post } from './post.entity';
import { Server } from './server.entity';
import type { Session } from './user_session.entity';
import { Token } from './user_token.entity';

@Entity({ name: 'users' })
@Unique(['name', 'email'])
export class User extends BaseEntity {
  @ApiProperty({ example: 'Danimai' })
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @ApiProperty({ example: 'example@danimai.com' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  password: string;

  @ApiHideProperty()
  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @ApiHideProperty()
  @OneToMany(() => Token, (token) => token.user)
  tokens: Token[];

  @ApiHideProperty()
  @Exclude()
  previousPassword: string;

  @ApiHideProperty()
  @ManyToOne('Media', 'avatars')
  @JoinColumn({ name: 'avatar_id' })
  avatar: Relation<Media>;

  @ApiHideProperty()
  @Column({ type: 'uuid', nullable: true })
  avatar_id: string;

  @ApiHideProperty()
  @OneToMany('Session', 'user')
  sessions: Relation<Session[]>;

  @ApiHideProperty()
  @OneToMany('Post', 'user')
  posts: Relation<Post[]>;

  @OneToMany('Server', 'user')
  servers: Relation<Server[]>;

  @OneToMany('Notification', 'user')
  notifications: Relation<Notification[]>;

  @AfterLoad()
  storePasswordInCache() {
    this.previousPassword = this.password;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async setPassword() {
    if (this.previousPassword !== this.password && this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
    this.email = this.email.toLowerCase();
  }

  comparePassword(password: string) {
    return bcrypt.compareSync(password, this.password);
  }
}
