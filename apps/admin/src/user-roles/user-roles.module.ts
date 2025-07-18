import { Role, RolePermissionCondition, User } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRolesController } from './user-roles.controler';
import { UserRolesService } from './user-roles.service';
import { UserPermissions } from '@app/entities/user_permissions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      UserPermissions,
      RolePermissionCondition,
      User,
    ]),
  ],
  providers: [UserRolesService],
  controllers: [UserRolesController],
})
export class UserRolesModule {}
