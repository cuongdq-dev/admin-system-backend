import { ApiProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Relation,
} from 'typeorm';
import { BaseEntity } from './base';
import { User } from './user.entity';
import { ValidationGroup } from 'common/crud/validation-group';

@Entity({ name: 'servers' })
export class Server extends BaseEntity {
  @ApiProperty({ example: 'Server Contabo' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @MaxLength(255, { always: true })
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @ApiProperty({ example: '127.0.0.1' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @MaxLength(255, { always: true })
  @Column({ type: 'varchar', length: 200 })
  host: string;

  @ApiProperty({ example: '22' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @MaxLength(255, { always: true })
  @Column({ type: 'varchar', length: 200 })
  port: string;

  @ApiProperty({ example: 'user' })
  @Column({ type: 'varchar', length: 200 })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  user: string;

  @ApiProperty({ example: 'Password@123' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  password: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  comparePassword(password: string) {
    return bcrypt.compareSync(password, this.password);
  }

  @ManyToOne('users', 'servers')
  @JoinColumn({ name: 'owner_id' })
  owner: Relation<User>;

  @ApiProperty()
  @Column({ type: 'uuid' })
  owner_id: string;
}
