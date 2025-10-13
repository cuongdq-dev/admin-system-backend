import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base';
import { Bill } from './bill.entity';

@Entity('bill_items')
export class BillItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Bill, (b) => b.items, { onDelete: 'CASCADE' })
  bill: Bill;

  @Column()
  name: string; // Tên món, vd "Cà phê sữa"

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number; // Giá 1 đơn vị

  @Column('decimal', { precision: 10, scale: 2 })
  total: number; // = quantity * price
}
