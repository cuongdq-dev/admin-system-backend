import { ValidationGroup } from '@app/crud/validation-group';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base';
import { Repository } from './repository.entity';
import { ServerService } from './service_service.entity';
import { User } from './user.entity';

@Entity({ name: 'servers' })
@Unique(['name', 'host'])
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
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_connected: boolean;

  @ManyToOne('users', 'servers')
  @JoinColumn({ name: 'owner_id' })
  owner: Relation<User>;

  @ApiProperty()
  @Column({ type: 'uuid' })
  owner_id: string;

  @OneToMany(() => ServerService, (serverService) => serverService.server, {
    cascade: true,
  })
  server_services: ServerService[];

  @OneToMany(() => Repository, (repository) => repository.server, {
    cascade: true,
  })
  repositories: Repository[];
}
