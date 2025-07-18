// role_permission_conditions.entity.ts
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base';
import { Role } from './user_roles.entity';
import { UserPermissions } from './user_permissions.entity';

@Entity('role_permission_conditions')
@Unique(['role_id', 'permission_id'])
export class RolePermissionCondition extends BaseEntity {
  @ManyToOne(() => Role, (role) => role.role_permission_conditions)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ type: 'uuid' })
  role_id: string;

  @ManyToOne(
    () => UserPermissions,
    (permission) => permission.role_permission_conditions,
  )
  @JoinColumn({ name: 'permission_id' })
  permission: UserPermissions;

  @Column({ type: 'uuid' })
  permission_id: string;

  @Column({ type: 'jsonb', nullable: true })
  conditions: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, any>;
}
