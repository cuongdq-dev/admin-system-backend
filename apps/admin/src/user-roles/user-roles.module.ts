import { Permission, Role, RolePermission, User } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRolesController } from './user-roles.controler';
import { UserRolesService } from './user-roles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, RolePermission, User])],
  providers: [UserRolesService],
  controllers: [UserRolesController],
})
export class UserRolesModule {}
