// src/modules/groups/group.controller.ts
import { UserParam } from '@app/decorators';
import { User } from '@app/entities';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AddMemberDto, CreateGroupDto, SendMessageDto } from './dto/group.dto';
import { GroupService } from './group.service';

@ApiTags('Groups')
@ApiBearerAuth()
@Controller({ path: 'groups', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class GroupController {
  constructor(private readonly svc: GroupService) {}

  @Post()
  async create(@UserParam() user: User, @Body() dto: CreateGroupDto) {
    return this.svc.createGroup(user.id, dto);
  }

  @Get()
  async getGroups(
    @UserParam() user: User,
    @Query('pageSize') pageSize = 10,
    @Query('page') page = 1,
  ) {
    return this.svc.getGroupsOverview(user.id, page, pageSize);
  }

  @Get('/:groupId/messages')
  async getMessageByGroupsId(
    @UserParam() user: User,
    @Param() { groupId }: { groupId: string },
    @Query('pageSize') pageSize = 20,
    @Query('page') page = 1,
  ) {
    return this.svc.getMessageByGroupId(user.id, groupId, page, pageSize);
  }

  @Post('/:groupId/messages')
  async sendMessage(
    @UserParam() user: User,
    @Param() { groupId }: { groupId: string },
    @Body() body: SendMessageDto,
  ) {
    return this.svc.sendMessage(user.id, groupId, body);
  }

  @Post('/check-email')
  async checkUser(@Body() { email }: { email: string }) {
    return this.svc.checkUser(email);
  }

  @Post('/:groupId/members')
  async addMembers(
    @UserParam() user: User,
    @Param() { groupId }: { groupId: string },
    @Body() body: AddMemberDto,
  ) {
    return this.svc.addMembers(user.id, groupId, body);
  }

  @Post('/:invitationId/accept')
  async acceptInvitation(
    @UserParam() user: User,
    @Param('invitationId') invitationId: string,
  ) {
    return this.svc.acceptInvitation(user.id, invitationId);
  }

  @Post('/:invitationId/reject')
  async rejectInvitation(
    @UserParam() user: User,
    @Param('invitationId') invitationId: string,
  ) {
    return this.svc.rejectInvitation(user.id, invitationId);
  }
}
