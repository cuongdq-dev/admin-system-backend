// src/modules/groups/group.module.ts
import {
  Bill,
  BillItem,
  BillShare,
  Group,
  GroupMember,
  Message,
  MessageRead,
  Session,
  User,
} from '@app/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirebaseModule } from '../firebase/firebase.module';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      GroupMember,
      Bill,
      User,
      BillItem,
      Session,
      BillShare,
      Message,
      MessageRead,
    ]),
    FirebaseModule,
  ],
  providers: [GroupService],
  controllers: [GroupController],
  exports: [GroupService],
})
export class GroupModule {}
