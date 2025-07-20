// src/common/services/batch-log.service.ts

import { Role, User, Permission, RolePermission } from '@app/entities';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { DataSource, In, Repository } from 'typeorm';
import { RoleBodyDto } from './user-roles.dto';
import { rolesPaginateConfig } from './user-roles.pagination';

@Injectable()
export class UserRolesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async getAll(query: PaginateQuery, user: User) {
    return await paginate(query, this.roleRepository, rolesPaginateConfig);
  }

  async getDetail(role: Role) {
    return role;
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

      // Tạo danh sách RolePermission tương ứng
      const rolePermissions = createDto.permissions.map((p) =>
        manager.create(RolePermission, {
          role: savedRole,
          permission: { id: p.permissionId },
          conditions: p.conditions,
          created_by: user.id,
        }),
      );

      await manager.save(RolePermission, rolePermissions);

      const result = await manager.findOne(Role, {
        where: { id: savedRole.id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      return {
        ...result,
        permissions: result?.role_permissions?.map((rp) => ({
          ...rp.permission,
          conditions: rp.conditions,
        })),
      };
    });
  }

  async update(role: Role, input: RoleBodyDto) {
    return this.dataSource.transaction(async (manager) => {
      // Cập nhật name & description
      await manager.update(Role, role.id, {
        name: input.name,
        description: input.description,
      });

      // Xoá tất cả role_permissions cũ
      await manager.delete(RolePermission, { role: { id: role.id } });

      // Ghi mới lại
      const newRolePermissions = input.permissions.map((p) =>
        manager.create(RolePermission, {
          role: { id: role.id },
          permission: { id: p.permissionId },
          conditions: p.conditions,
          updated_by: role.updated_by,
        }),
      );

      await manager.save(RolePermission, newRolePermissions);

      const result = await manager.findOne(Role, {
        where: { id: role.id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      return result;
    });
  }

  /**
   * Xóa site (soft delete)
   */
  async delete(role: Role) {
    return this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Role, { id: role.id });
      await manager.softDelete(RolePermission, { role: { id: role.id } });

      return {
        message: 'Role deleted successfully.',
      };
    });
  }
}
