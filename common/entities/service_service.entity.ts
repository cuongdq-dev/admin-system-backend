import { ServiceStatusEnum as StatusEnum } from '@app/utils';
import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { BaseEntity } from './base';
import { Server } from './server.entity';
import { Service } from './service.entity';

@Entity({ name: 'server_services' })
export class ServerService extends BaseEntity {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  server_id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  service_id: string;

  @ApiProperty({ example: 'uninstalled', enum: StatusEnum })
  @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.UN_INSTALLED })
  installed: StatusEnum;

  @ManyToOne(() => Server, (server) => server.server_services)
  @JoinColumn({ name: 'server_id' })
  server: Relation<Server>;

  @ManyToOne(() => Service, (service) => service.server_services)
  @JoinColumn({ name: 'service_id' })
  service: Relation<Service>;
}
