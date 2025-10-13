import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base';
import { BillItem } from './bill-item.entity';
import { BillShare } from './bill-share.entity';
import { Group } from './group.entity';
import { User } from './user.entity';

@Entity('bills')
export class Bill extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ nullable: true })
  note?: string;

  @ManyToOne(() => Group, (g) => g.bills, { onDelete: 'CASCADE' })
  group: Group;

  @OneToMany(() => BillItem, (bi) => bi.bill, { cascade: true })
  items: BillItem[];

  @OneToMany(() => BillShare, (bs) => bs.bill, { cascade: true })
  shares: BillShare[];

  @ManyToOne(() => User, (user) => user.paidBills, { onDelete: 'SET NULL' })
  payer: User; // người trả tiền trước
}
