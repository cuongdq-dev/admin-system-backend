import { ValidationGroup } from '@app/crud/validation-group';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Relation,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base';
import { Server } from './server.entity';

@Entity({ name: 'repositories' })
@Unique(['name'])
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

  @ApiProperty({ example: '' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @Column({ type: 'text', nullable: true })
  repo_env: string;

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

  @ApiProperty({ example: '/project/xxx-project' })
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @Column({ type: 'text', nullable: true })
  server_path: string;

  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @Column({ type: 'text' })
  @Column({ name: 'image_id', nullable: true })
  image_id: string;

  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @Column({ name: 'image_name', nullable: true })
  image_name: string;

  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @Column({ name: 'container_id', nullable: true })
  container_id: string;

  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @IsString({ always: true })
  @Column({ name: 'container_name', nullable: true })
  container_name: string;

  @ManyToOne('Server', 'repositories')
  @JoinColumn({ name: 'server_id' })
  server: Relation<Server>;

  @ApiProperty()
  @Column({ type: 'uuid' })
  server_id: string;

  @ApiProperty()
  @IsOptional()
  @Column({ type: 'json', nullable: true })
  services?: {
    serviceName?: string;
    image?: string;
    buildContext?: string;
    envFile?: string;
    ports?: string;
    environment?: Array<{ variable?: string; value?: string }>;
    volumes?: Array<{ hostPath?: string; containerPath?: string }>;
  }[];
}
