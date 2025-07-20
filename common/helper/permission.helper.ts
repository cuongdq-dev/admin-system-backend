import { Permission, User } from '@app/entities';

export function userHasPermission(
  user: User,
  action: string,
  subject: string,
): Permission[] {
  if (!user.user_roles) return undefined;
  const matched: Permission[] = [];

  for (const role of user.user_roles) {
    for (const role_permissions of role.role.role_permissions) {
      if (
        role_permissions?.permission?.action === action &&
        role_permissions?.permission?.subject === subject
      ) {
        const mapper = {
          ...role_permissions.permission,
          conditions: role_permissions?.conditions,
        } as Permission;

        matched.push(mapper);
      }
    }
  }
  return matched.length > 0 ? matched : undefined;
}
