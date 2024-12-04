import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base';
import { ServerService } from './service_service.entity';

@Entity({ name: 'services' })
export class Service extends BaseEntity {
  @ApiProperty({ example: 'Docker' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ example: 'skill-icons:postgresql-dark' })
  @Column({ type: 'varchar', length: 100 })
  icon: string;

  @ApiProperty({ example: '200Mb' })
  @Column({ type: 'varchar', length: 100 })
  description: string;

  @OneToMany(() => ServerService, (serverService) => serverService.service)
  server_services: ServerService[];
}
