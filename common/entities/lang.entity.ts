import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from './base';

@Entity({ name: 'langs' })
@Unique(['code'])
export class Lang extends BaseEntity {
  @ApiProperty({ example: 'EN' })
  @Column({ type: 'varchar', length: 200 })
  code: string;

  @ApiProperty({ example: 'English' })
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @ApiProperty({ example: 'English language' })
  @Column({ type: 'varchar', length: 200 })
  description: string;
}
