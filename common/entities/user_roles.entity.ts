import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity('user_roles')
export class UserRole extends BaseEntity {
  @ManyToOne(() => User, (user) => user.user_roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, (role) => role.user_roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
