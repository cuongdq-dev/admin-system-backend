import { ValidationGroup } from '@app/crud/validation-group';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';
import { IsOptional } from 'class-validator';
import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base';
import { Book } from './book.entity';
import { Device } from './device.entity';
import { GroupMember } from './group-member.entity';
import type { Media } from './media.entity';
import { Message } from './message.entity';
import { Notification } from './notification.entity';
import type { Post } from './post.entity';
import { Server } from './server.entity';
import { Site } from './site.entity';
import { UserRole } from './user_roles.entity';
import type { Session } from './user_session.entity';
import { Token } from './user_token.entity';

export enum UserType {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
@Entity({ name: 'users' })
@Unique(['name', 'email'])
export class User extends BaseEntity {
  @ApiProperty({ example: 'Danimai' })
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @ApiProperty({ example: 'example@danimai.com' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiProperty({ example: 'stress city' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @ApiProperty({ example: '12345678' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  phoneNumber: string;

  @ApiProperty({ example: 'Password@123' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  password: string;

  @ApiHideProperty()
  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @Column({ type: 'enum', enum: UserType, nullable: true })
  @Index()
  type: UserType;

  @ApiHideProperty()
  @OneToMany(() => Token, (token) => token.user)
  tokens: Token[];

  @Column({ type: 'text', nullable: true })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  firebase_token: string;

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
  @ManyToOne('Media', 'banners')
  @JoinColumn({ name: 'banner_id' })
  banner: Relation<Media>;

  @ApiHideProperty()
  @Column({ type: 'uuid', nullable: true })
  banner_id: string;

  @ApiHideProperty()
  @OneToMany('Session', 'user')
  sessions: Relation<Session[]>;

  @ApiHideProperty()
  @OneToMany('Post', 'user')
  posts: Relation<Post[]>;

  @ApiHideProperty()
  @OneToMany('Book', 'user')
  books: Relation<Book[]>;

  @ApiHideProperty()
  @OneToMany('Site', 'user')
  sites: Relation<Site[]>;

  @OneToMany('Server', 'user')
  servers: Relation<Server[]>;

  @OneToMany('Notification', 'user')
  notifications: Relation<Notification[]>;

  @OneToMany(() => UserRole, (ur) => ur.user)
  user_roles: UserRole[];

  @Column({ nullable: true })
  firebase_uid: string;

  @OneToMany(() => GroupMember, (member) => member.user)
  memberships: GroupMember[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  @OneToMany(() => Device, (device) => device.user)
  devices: Device[];

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
