import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base';
import { Bill } from './bill.entity';
import { User } from './user.entity';

@Entity('bill_shares')
@Unique(['bill', 'user'])
export class BillShare extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Bill, (b) => b.shares, { onDelete: 'CASCADE' })
  bill: Bill;

  @ManyToOne(() => User, (u) => u.billShares, { onDelete: 'CASCADE' })
  user: User;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number; // phần tiền user này phải trả

  @Column({ default: false })
  isPaid: boolean;
}
