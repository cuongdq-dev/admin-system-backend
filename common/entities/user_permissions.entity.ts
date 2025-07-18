import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base';
import { Role } from './user_roles.entity';
import { RolePermissionCondition } from './role_permission_condition.entity';

// common/entities/permission.entity.ts
@Entity({ name: 'user_permissions' })
@Unique(['action', 'subject'])
export class UserPermissions extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  action: string; //read, update, create, delete, publish

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  conditions: Record<string, any>;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  @OneToMany(() => RolePermissionCondition, (rpc) => rpc.permission)
  role_permission_conditions: RolePermissionCondition[];
}
