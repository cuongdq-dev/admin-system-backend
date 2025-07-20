import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';
import { BaseEntity } from './base';

@Entity('role_permissions')
export class RolePermission extends BaseEntity {
  @ManyToOne(() => Role, (role) => role.role_permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.role_permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @Column({ type: 'jsonb', nullable: true })
  conditions?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  properties?: Record<string, any>;
}
