import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base';
import { Role } from './user_roles.entity';

// common/entities/permission.entity.ts
@Entity({ name: 'user_permissions' })
@Unique(['action', 'subject', 'role_id'])
export class UserPermissions extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  conditions: Record<string, any>;

  @ManyToOne(() => Role, (role) => role.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ type: 'uuid' })
  role_id: string;
}
