// src/common/services/batch-log.service.ts

import { Role, User } from '@app/entities';
import { UserPermissions } from '@app/entities/user_permissions.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { In, Repository } from 'typeorm';
import { RoleBodyDto } from './user-roles.dto';
import { userRolesPaginateConfig } from './user-roles.pagination';

@Injectable()
export class UserRolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(UserPermissions)
    private readonly userPermissionsRepository: Repository<UserPermissions>,
  ) {}

  async getAll(query: PaginateQuery, user: User) {
    return await paginate(query, this.roleRepository, userRolesPaginateConfig);
  }

  async getDetail(role: Role) {
    return role;
  }

  async create(user: User, createDto: RoleBodyDto) {
    const permissions = await this.userPermissionsRepository.find({
      where: { id: In(createDto?.permissions?.map((p) => p.permissionId)) },
    });

    const result = await this.roleRepository
      .create({
        ...createDto,
        permissions: permissions,
        created_by: user.id,
        type: 'custom',
      })
      .save();
    return this.roleRepository.findOne({ where: { id: result.id } });
  }

  async update(role: Role, input: RoleBodyDto) {
    const permissions = await this.userPermissionsRepository.find({
      where: { id: In(input?.permissions?.map((p) => p.permissionId)) },
    });

    const newData = {
      id: role.id,
      name: input.name,
      description: input.description,
      permissions: permissions,
    };

    const resultUpdate = await this.roleRepository.save(newData);

    return resultUpdate;
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
