import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { BaseEntity } from './base';
import { User } from './user.entity';
import { UserPermissions } from './user_permissions.entity';
import { RolePermissionCondition } from './role_permission_condition.entity';

// common/entities/role.entity.ts
@Entity({ name: 'roles' })
export class Role extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'custom' })
  type: 'system' | 'custom';

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToMany(() => UserPermissions, (permission) => permission.roles, {
    cascade: true,
  })
  @JoinTable({
    name: 'user_permissions_roles',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: UserPermissions[];

  @OneToMany(() => RolePermissionCondition, (rpc) => rpc.role, {
    cascade: true,
  })
  role_permission_conditions: RolePermissionCondition[];

  @ManyToMany(() => User, (user) => user.roles, { cascade: true })
  users: User[];
}
