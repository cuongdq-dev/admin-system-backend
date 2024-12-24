import { Lang, Notification, User } from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    TypeOrmModule.forFeature([Lang]),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [SettingService],
  controllers: [SettingController],
})
export class SettingModule {}
