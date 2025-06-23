import {
  Book,
  Category,
  Lang,
  Notification,
  Post,
  Site,
  User,
} from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      Book,
      Lang,
      User,
      Post,
      Site,
      Category,
    ]),
  ],
  providers: [SettingService],
  controllers: [SettingController],
})
export class SettingModule {}
