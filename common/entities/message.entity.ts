import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Group } from './group.entity';
import { MessageRead } from './message-read.entity';
import { BaseEntity } from './base';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  SYSTEM = 'system',
}

@Entity('messages')
export class Message extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Group, (g) => g.messages, { onDelete: 'CASCADE' })
  group: Group;

  @ManyToOne(() => User, (u) => u.messages, { onDelete: 'CASCADE' })
  sender: User;

  @Column('text')
  content: string;

  @OneToMany(() => MessageRead, (mr) => mr.message, { onDelete: 'CASCADE' })
  reads: MessageRead[];

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;
}
