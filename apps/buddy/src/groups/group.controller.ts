// src/modules/groups/group.controller.ts
import { UserParam } from '@app/decorators';
import { Group, GroupMember, User } from '@app/entities';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiTags,
  PickType,
} from '@nestjs/swagger';
import {
  AddMemberDto,
  CreateGroupDto,
  GROUP_MEMBER_RELATIONS,
  GROUP_RELATIONS,
  SendMessageDto,
} from './dto/group.dto';
import { GroupService } from './group.service';
import { IsIDExistPipe } from './pipes/group.pipe';

@ApiTags('Groups')
@ApiBearerAuth()
@Controller({ path: 'groups', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @ApiBody({
    type: PickType(CreateGroupDto, ['name', 'avatar', 'description']),
  })
  async create(@UserParam() user: User, @Body() dto: CreateGroupDto) {
    return this.groupService.createGroup(user.id, dto);
  }

  @Get()
  async getGroups(
    @UserParam() user: User,
    @Query('pageSize') pageSize = 10,
    @Query('page') page = 1,
  ) {
    return this.groupService.getGroupsOverview(user.id, page, pageSize);
  }

  @Post('/check-email/:email')
  @ApiParam({ name: 'email', type: 'string' })
  async checkUser(
    @Param('email', IsIDExistPipe({ entity: User, filterField: 'email' }))
    user,
  ) {
    return user;
  }

  @Get('/:groupId/messages')
  @ApiParam({ name: 'groupId', type: 'string', format: 'uuid' })
  async getMessageByGroupsId(
    @Param('groupId', ParseUUIDPipe, IsIDExistPipe({ entity: Group }))
    group: Group,

    @Query('pageSize') pageSize = 20,
    @Query('page') page = 1,
  ) {
    return this.groupService.getMessageByGroupId(page, pageSize, group);
  }

  @Post('/:groupId/messages')
  @ApiBody({ type: PickType(SendMessageDto, ['content']) })
  @ApiParam({ name: 'groupId', type: 'string', format: 'uuid' })
  async sendMessage(
    @UserParam() user: User,
    @Param('groupId', ParseUUIDPipe, IsIDExistPipe({ entity: Group }))
    group: Group,
    @Body() body: SendMessageDto,
  ) {
    return this.groupService.sendMessage(user.id, group, body);
  }

  @Post('/:groupId/members')
  @ApiParam({ name: 'groupId', type: 'string', format: 'uuid' })
  @ApiBody({ type: PickType(AddMemberDto, ['emails']) })
  async addMembers(
    @UserParam() user: User,
    @Param(
      'groupId',
      ParseUUIDPipe,
      IsIDExistPipe({ entity: Group, relations: GROUP_RELATIONS }),
    )
    group: Group,

    @Body() body: AddMemberDto,
  ) {
    return this.groupService.addMembers(user, group, body);
  }

  @Delete('/:groupId/members/:memberId')
  @ApiParam({ name: 'groupId', type: 'string', format: 'uuid' })
  async removeMembers(
    @UserParam() user: User,
    @Param(
      'groupId',
      ParseUUIDPipe,
      IsIDExistPipe({ entity: Group, relations: GROUP_RELATIONS }),
    )
    group: Group,

    @Param('memberId', ParseUUIDPipe, IsIDExistPipe({ entity: User }))
    member: User,
  ) {
    return this.groupService.removeMember(member, group, user);
  }

  @Post('/:invitationId/accept')
  @ApiParam({ name: 'invitationId', type: 'string', format: 'uuid' })
  async acceptInvitation(
    @UserParam() user: User,

    @Param(
      'invitationId',
      ParseUUIDPipe,
      IsIDExistPipe({ entity: GroupMember, relations: GROUP_MEMBER_RELATIONS }),
    )
    groupMember: GroupMember,
  ) {
    return this.groupService.acceptInvitation(user, groupMember);
  }

  @Post('/:invitationId/reject')
  @ApiParam({ name: 'invitationId', type: 'string', format: 'uuid' })
  async rejectInvitation(
    @UserParam() user: User,
    @Param(
      'invitationId',
      ParseUUIDPipe,
      IsIDExistPipe({ entity: GroupMember }),
    )
    groupMember: GroupMember,
  ) {
    return this.groupService.rejectInvitation(user, groupMember);
  }
}
