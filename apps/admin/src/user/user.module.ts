import {
  Category,
  Media,
  Post,
  Role,
  Site,
  SitePost,
  User,
} from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from '../media/media.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserPermissions } from '@app/entities/user_permissions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Site,
      Post,
      UserPermissions,
      Role,
      Category,
      SitePost,
      Media,
    ]),
    // MulterModule.registerAsync({ useClass: MulterConfigService }),
    MediaModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
