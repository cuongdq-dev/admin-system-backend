import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base';
import { Message } from './message.entity';
import { User } from './user.entity';

@Entity('message_reads')
@Unique(['message', 'user'])
export class MessageRead extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Message, (m) => m.reads, { onDelete: 'CASCADE' })
  message: Message;

  @ManyToOne(() => User, (u) => u.messageReads, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  readAt: Date;
}
