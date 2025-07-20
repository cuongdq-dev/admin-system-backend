import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';

import { User } from '@app/entities';
import { userHasPermission } from 'common/helper/permission.helper';
import { InjectDataSource } from '@nestjs/typeorm';
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectDataSource() private dataSource: DataSource,
    @Inject(REQUEST) private request: any,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const entity = this.reflector.get('entity', context.getHandler());
    const action = this.reflector.get('action', context.getHandler());
    if (!entity) {
      return true; // Không cần kiểm tra nếu không gắn metadata
    }

    const userRepository = this.dataSource.getRepository(User);
    const metadata = this.dataSource.getMetadata(entity);
    const tableName = metadata.tableName;

    const userRequest =
      this.request?.user?.user || this.request?.user?.customer;

    const user = await userRepository.findOne({
      where: { id: userRequest.id },

      relations: [
        'user_roles',
        'user_roles.role',
        'user_roles.role.role_permissions',
        'user_roles.role.role_permissions.permission',
      ],
    });
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const permission = userHasPermission(user, action, tableName);

    if (!permission) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'You do not have permission to access this resource',
        code: 'PERMISSION_DENIED',
      });
    }
    return true;
  }
}
