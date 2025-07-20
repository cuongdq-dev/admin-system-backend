import { Entity, Column, OneToMany, Unique } from 'typeorm';
import { RolePermission } from './role_permission.entity';
import { BaseEntity } from './base';

@Entity('permissions')
@Unique(['action', 'subject'])
export class Permission extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'varchar', length: 255 })
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  properties?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  conditions?: Record<string, any>;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  role_permissions: RolePermission[];
}
