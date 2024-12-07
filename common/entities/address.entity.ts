import { ValidationGroup } from '@app/crud/validation-group';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { BaseEntity } from './base';
import type { Customer } from './customer.entity';

@Entity({ name: 'addresses' })
export class Address extends BaseEntity {
  @ApiProperty({ example: 'Deepak' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @MaxLength(255, { always: true })
  @Column()
  first_name: string;

  @ApiProperty({ example: 'Mandal' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @MaxLength(255, { always: true })
  @IsString({ always: true })
  @Column()
  last_name: string;

  @ApiProperty({ example: 'Home' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @MaxLength(255, { always: true })
  @IsString({ always: true })
  @Column()
  name: string;

  @ApiProperty({ example: 'John Does Road' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @MaxLength(255, { always: true })
  @IsString({ always: true })
  @Column()
  address: string;

  @ApiProperty({ example: 'Nagpur' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @MaxLength(255, { always: true })
  @IsString({ always: true })
  @Column()
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @MaxLength(255, { always: true })
  @IsString({ always: true })
  @Column()
  state: string;

  @ApiProperty({ example: 'India' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @MaxLength(255, { always: true })
  @IsString({ always: true })
  @Column()
  country: string;

  @ApiProperty({ example: '469XXX' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @MaxLength(255, { always: true })
  @IsString({ always: true })
  @Column()
  zip_code: string;

  @ManyToOne('Customer', 'addresses')
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<Customer>;

  @ApiProperty()
  @Column({ type: 'uuid' })
  customer_id: string;
}
