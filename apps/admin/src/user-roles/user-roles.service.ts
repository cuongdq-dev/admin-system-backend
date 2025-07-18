// src/common/services/batch-log.service.ts

import { Role, RolePermissionCondition, User } from '@app/entities';
import { UserPermissions } from '@app/entities/user_permissions.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { DataSource, In, Repository } from 'typeorm';
import { RoleBodyDto } from './user-roles.dto';
import { userRolesPaginateConfig } from './user-roles.pagination';

@Injectable()
export class UserRolesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(RolePermissionCondition)
    private readonly permissionConditionRepository: Repository<RolePermissionCondition>,
  ) {}

  async getAll(query: PaginateQuery, user: User) {
    return await paginate(query, this.roleRepository, userRolesPaginateConfig);
  }

  async getDetail(role: Role) {
    return {
      ...role,
      permissions: role.permissions.map((p) => {
        return {
          ...p,
          conditions: p?.role_permission_conditions[0]?.conditions,
        };
      }),
    };
  }

  async create(user: User, createDto: RoleBodyDto) {
    return this.dataSource.transaction(async (manager) => {
      const role = manager.create(Role, {
        name: createDto.name,
        description: createDto.description,
        type: 'custom',
        created_by: user.id,
      });
      const savedRole = await manager.save(role);

      const rpcList = createDto.permissions.map((p) =>
        manager.create(RolePermissionCondition, {
          role: savedRole,
          permission: { id: p.permissionId },
          conditions: p.conditions,
        }),
      );
      await manager.save(RolePermissionCondition, rpcList);

      const result = await manager.findOne(Role, {
        where: { id: role?.id },
        relations: [
          'users',
          'permissions',
          'permissions.role_permission_conditions',
        ],
      });

      return {
        ...result,
        permissions: result?.permissions?.map((p) => {
          return {
            ...p,
            conditions: p?.role_permission_conditions[0]?.conditions,
          };
        }),
      };
    });
  }

  async update(role: Role, input: RoleBodyDto) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Tìm các permissions theo ID
      const permissionIds =
        input?.permissions?.map((p) => p.permissionId) ?? [];
      const permissions = await manager.find(UserPermissions, {
        where: { id: In(permissionIds) },
      });

      // 2. Cập nhật thông tin role và permissions
      const updatedRole = await manager.save(Role, {
        id: role.id,
        name: input.name,
        description: input.description,
        permissions,
      });

      // 3. Xoá toàn bộ conditions cũ của role
      await manager.delete(RolePermissionCondition, { role_id: role.id });

      // 4. Ghi lại conditions mới nếu có
      const conditions = input.permissions
        .filter((p) => p.conditions)
        .map((p) => ({
          role_id: role.id,
          permission_id: p.permissionId,
          conditions: p.conditions,
        }));

      if (conditions.length > 0) {
        await manager.save(RolePermissionCondition, conditions);
      }

      const result = await manager.findOne(Role, {
        where: { id: role?.id },
        relations: [
          'users',
          'permissions',
          'permissions.role_permission_conditions',
        ],
      });

      return {
        ...result,
        permissions: result?.permissions?.map((p) => {
          return {
            ...p,
            conditions: p?.role_permission_conditions[0]?.conditions,
          };
        }),
      };
    });
  }

  /**
   * Xóa site (soft delete)
   */
  async delete(role: Role) {
    await this.roleRepository.delete({ id: role.id });
    return {
      message: 'Site deleted successfully.',
    };
  }
}
