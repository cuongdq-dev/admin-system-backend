import { Group, GroupMember, Message, User } from '@app/entities';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';
import { FindOptionsRelations, FindOptionsSelect } from 'typeorm';

export class AddMemberDto {
  @IsArray()
  @ApiProperty({ example: ['example@gmail.com', 'example-2@gmail.com'] })
  emails: string[];
}

export class CreateGroupDto {
  @IsString()
  @ApiProperty({ example: 'Year End party' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Year End Party 2025' })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '🏖️' })
  avatar?: string;

  // initial member user ids (optional)
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayNotEmpty()
  @ApiProperty({ example: ['member_id_1', 'member_id_2'] })
  memberIds?: string[];
}

export class GenerateInvoiceDto {
  @IsString()
  @ApiProperty({ example: '' })
  text?: string;
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class SendMessageDto {
  @IsString()
  @ApiProperty({ example: 'this is message to user-1' })
  content?: string;
}

export const GROUP_MEMBER_RELATIONS = [
  'group',
  'group.members',
  'group.members.user',
  'group.bills',
  'group.bills.items',
  'user',
  'invitedBy',
] as FindOptionsRelations<GroupMember>;

export const MESSAGE_RELATIONS = [
  'group',
  'sender',
  'group.members',
  'group.members.user',
] as FindOptionsRelations<Message>;

export const GROUP_RELATIONS = [
  'members',
  'members.user',
] as FindOptionsRelations<Group>;

export const UserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: { slug: true, filname: true, url: true },
  created_at: true,
} as FindOptionsSelect<User>;

export const GroupSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  avatar: true,
  created_at: true,

  members: {
    id: true,
    joinedAt: true,
    role: true,
    status: true,
    invitedBy: UserSelect,
    last_read_at: true,
    last_read_message_id: true,
    last_read_message_number: true,
    user: UserSelect,
    created_at: true,
  },
} as FindOptionsSelect<Group>;

export const GroupMemberSelect = {
  id: true,
  joinedAt: true,
  role: true,
  status: true,
  invitedBy: UserSelect,
  invitedAt: true,
  group: GroupSelect,
  user: UserSelect,
  last_read_at: true,
  last_read_message_id: true,
  last_read_message_number: true,
  created_at: true,
} as FindOptionsSelect<GroupMember>;
