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
import { DataSource, FindOptionsRelations } from 'typeorm';

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
    protected exceptionFactory: (error: string) => any;
    constructor(
      @InjectDataSource() private dataSource: DataSource,
      @Inject(REQUEST) private request: any,
    ) {}
    async transform(value: string) {
      // GET META DATA
      const userRepository = this.dataSource.getRepository(User);

      const repository = this.dataSource.getRepository(entity);

      const metadata = this.dataSource.getMetadata(entity);

      const tableName = subject || metadata.tableName;
      const where: any = { [filterField]: value };

      const userRequest =
        this.request?.user?.user || this.request?.user?.customer;

      const user = await userRepository.findOne({
        where: { id: userRequest.id },
        relations: [
          'roles',
          'roles.permissions',
          'roles.permissions.role_permission_conditions',
        ],
      });

      if (!user) throw new ForbiddenException('User not authenticated');
      const permission = userHasPermission(user, action, tableName);
      if (!permission) {
        throw new ForbiddenException({
          statusCode: 403,
          message: 'You do not have permission to access this resource',
          code: 'PERMISSION_DENIED',
        });
      }

      const requiresOwner = permission.some(
        (p) => p.conditions?.ownerOnly === true,
      );

      if (!!requiresOwner) {
        where[ownerField] = user.id;
      }
      const instance = await repository.findOne({ where, relations });

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

      return instance;
    }
  }
  return PermissionPipe;
};
