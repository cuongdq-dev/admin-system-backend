import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RolePermission } from './role_permission.entity';
import { UserRole } from './user_roles.entity';
import { BaseEntity } from './base';

@Entity('roles')
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'custom' })
  type: 'system' | 'custom';

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => UserRole, (ur) => ur.role)
  user_roles: UserRole[];

  @OneToMany(() => RolePermission, (rp) => rp.role)
  role_permissions: RolePermission[];
}
