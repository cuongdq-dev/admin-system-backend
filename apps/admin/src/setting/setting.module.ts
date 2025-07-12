import {
  Book,
  Category,
  Lang,
  Notification,
  Post,
  Role,
  Site,
  User,
} from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';
import { UserPermissions } from '@app/entities/user_permissions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      Role,
      Book,
      Lang,
      User,
      Post,
      Site,
      UserPermissions,
      Category,
    ]),
  ],
  providers: [SettingService],
  controllers: [SettingController],
})
export class SettingModule {}
