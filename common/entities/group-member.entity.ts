import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { BaseEntity } from './base';
import { Group } from './group.entity';
import { User } from './user.entity';

export type GroupRole = 'member' | 'admin' | 'owner';
export type GroupMemberStatus = 'active' | 'invited' | 'left' | 'reject';

@Entity('group_members')
@Unique(['group', 'user'])
export class GroupMember extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Group, (g) => g.members, { onDelete: 'CASCADE' })
  group: Group;

  @ManyToOne(() => User, (u) => u.groupMembers, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    default: 'member',
    type: 'enum',
    enum: ['member', 'admin', 'owner'],
  })
  role: GroupRole;

  @Column({
    type: 'enum',
    default: 'invited',
    enum: ['active', 'invited', 'left', 'reject'],
  })
  status: GroupMemberStatus;

  @ManyToOne(() => User, { nullable: true })
  invitedBy?: User;

  @CreateDateColumn({ nullable: true })
  invitedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  leftAt?: Date;

  @ManyToOne(() => User, { nullable: true })
  leftBy?: User;

  @UpdateDateColumn()
  joinedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  last_read_message_id: string | null;

  @Column({ type: 'timestamp', nullable: true })
  last_read_at: Date | null;

  @Column({ type: 'int', default: 0 })
  last_read_message_number: number;
}
