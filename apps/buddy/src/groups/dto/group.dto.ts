import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';

export class AddMemberDto {
  @IsArray()
  emails: string[];
}

export class CreateGroupDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  // initial member user ids (optional)
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayNotEmpty()
  memberIds?: string[];
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
  content?: string;
}
