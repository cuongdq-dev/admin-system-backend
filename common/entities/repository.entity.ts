import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ValidationGroup } from 'common/crud/validation-group';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';
import { BaseEntity } from './base';
import { ServerService } from './service_service.entity';
import { User } from './user.entity';
import { Server } from './server.entity';

@Entity({ name: 'repositories' })
export class Repository extends BaseEntity {
  @ApiProperty({ example: 'Repo Name' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @MaxLength(255, { always: true })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ example: 'https://github.com....' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @Column({ type: 'text' })
  github_url: string;

  @ApiProperty({ example: '' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @Column({ type: 'text' })
  fine_grained_token: string;

  @ApiProperty({ example: 'github123' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @MaxLength(255, { always: true })
  @Column({ type: 'varchar', length: 255 })
  username: string;

  @ApiProperty({ example: 'example@email.com' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @MaxLength(255, { always: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @ManyToOne('Server', 'repositories')
  @JoinColumn({ name: 'server_id' })
  server: Relation<Server>;

  @ApiProperty()
  @Column({ type: 'uuid' })
  server_id: string;
}