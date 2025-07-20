import { User } from '@app/entities';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { userHasPermission } from 'common/helper/permission.helper';
import { DataSource, FindOptionsRelations, FindOptionsWhere } from 'typeorm';

type PermissionPipeType = (options: {
  entity: EntityClassOrSchema;
  subject?: string;
  action?: 'read' | 'create' | 'update' | 'delete' | 'publish';
  filterField?: string;
  ownerField?: string;
  relations?: FindOptionsRelations<any> | string[];
}) => any;

export const PermissionDetailPipe: PermissionPipeType = ({
  entity,
  subject,
  filterField = 'id',
  action = 'read',
  ownerField = 'created_by',
  relations,
}) => {
  @Injectable()
  class PermissionPipe implements PipeTransform {
    constructor(
      @InjectDataSource() private dataSource: DataSource,
      @Inject(REQUEST) private request: any,
    ) {}

    async transform(value: string) {
      const userRepository = this.dataSource.getRepository(User);
      const repository = this.dataSource.getRepository(entity);
      const metadata = this.dataSource.getMetadata(entity);
      const tableName = subject || metadata.tableName;

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

      if (!user) throw new ForbiddenException('User not authenticated');

      const permissions = userHasPermission(user, action, tableName);
      if (!permissions) {
        throw new ForbiddenException({
          statusCode: 403,
          message: 'You do not have permission to access this resource',
          code: 'PERMISSION_DENIED',
        });
      }

      const ownerOnly = permissions.some(
        (p) => p.conditions?.ownerOnly === true,
      );
      const asOwner = permissions.some((p) => p.conditions?.asOwner === true);

      const where: FindOptionsWhere<any> = { [filterField]: value };

      // Apply ownerOnly filter
      if (ownerOnly) {
        where[ownerField] = user.id;
      }

      // If asOwner → do not restrict to user.id directly
      if (asOwner) {
        delete where[ownerField];
      }

      // 1. Try to find the instance with current filters
      const instance = await repository.findOne({ where, relations });

      if (!ownerOnly && !asOwner) {
        return instance;
      }
      // 2. If not found, check if exists without owner constraints
      if (!instance) {
        const existsWithoutOwnerCheck = await repository.findOne({
          where: { [filterField]: value },
        });

        if (existsWithoutOwnerCheck) {
          throw new ForbiddenException({
            statusCode: 403,
            message: `Access denied: You don't have permission to access this ${tableName}.`,
            code: 'PERMISSION_DENIED',
          });
        } else {
          throw new NotFoundException({
            statusCode: 404,
            message: `${(entity as any).name} with ${filterField} = "${value}" not found.`,
            code: 'ENTITY_NOT_FOUND',
          });
        }
      }

      // 3. If asOwner, apply further logic to validate based on same role or owner
      if (asOwner) {
        const ownerId = instance?.[ownerField];

        // ownerField is null → shared data → allow
        if (!ownerId) return instance;

        // If user is the owner → allow
        if (ownerId === user.id) return instance;

        // Else → check if the owner has same role with the current user
        const owner = await userRepository.findOne({
          where: { id: ownerId },

          relations: [
            'user_roles',
            'user_roles.role',
            'user_roles.role.role_permissions',
            'user_roles.role.role_permissions.permission',
          ],
        });

        if (!owner) {
          throw new ForbiddenException({
            statusCode: 403,
            message: `Access denied: Cannot determine owner of the resource.`,
            code: 'PERMISSION_DENIED',
          });
        }

        const sameRole = owner.user_roles.some((ownerRole) =>
          user.user_roles.some((userRole) => userRole.id === ownerRole.id),
        );

        if (!sameRole) {
          throw new ForbiddenException({
            statusCode: 403,
            message: `Access denied: You can only access data of users with the same role.`,
            code: 'PERMISSION_DENIED',
          });
        }

        // Optional: check if user has permission on behalf of owner
        const hasPermissionForOwner = userHasPermission(
          owner,
          action,
          tableName,
        );
        if (!hasPermissionForOwner) {
          throw new ForbiddenException({
            statusCode: 403,
            message: `Access denied: You don't have acting permission for this role.`,
            code: 'PERMISSION_DENIED_AS_OWNER',
          });
        }
      }

      // All checks passed → return the data
      return instance;
    }
  }

  return PermissionPipe;
};
