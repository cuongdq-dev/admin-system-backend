import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { User } from './user.entity';
import { BillItem } from './bill-item.entity';

@Entity('bills')
export class Bill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('decimal', { precision: 10, scale: 2 })
  total_amount: number;

  @ManyToOne(() => Group, (group) => group.bills, { onDelete: 'CASCADE' })
  group: Group;

  @ManyToOne(() => User, (user) => user.id)
  created_by: User;

  @OneToMany(() => BillItem, (item) => item.bill)
  items: BillItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
