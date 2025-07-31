import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base';
import { RolePermission } from './role_permission.entity';
import { UserRole } from './user_roles.entity';

export enum CodeConstants {
  SUPER_ADMIN_CODE = 'api-super-admin',
  EDITOR_CODE = 'api-editor',
  AUTHOR_CODE = 'api-author',
}
@Entity('roles')
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'enum', enum: CodeConstants, nullable: true })
  code: CodeConstants;

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
