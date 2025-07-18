import { User } from '@app/entities';
import { UserPermissions } from '@app/entities/user_permissions.entity';

export function userHasPermission(
  user: User,
  action: string,
  subject: string,
): UserPermissions[] {
  if (!user.roles) return undefined;
  const matched: UserPermissions[] = [];

  for (const role of user.roles) {
    for (const permission of role.permissions) {
      if (permission.action === action && permission.subject === subject) {
        const conditions = permission.role_permission_conditions[0];
        const mapper = {
          ...permission,
          conditions: conditions?.conditions,
        } as UserPermissions;

        matched.push(mapper);
      }
    }
  }

  return matched.length > 0 ? matched : undefined;
}
