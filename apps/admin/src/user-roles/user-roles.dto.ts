import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidationGroup } from '@app/crud/validation-group';

type Condition = {
  [key: string]: any; // ví dụ: { region: 'VN', time: 'daytime' }
};
class PermissionIdDto {
  @IsUUID()
  permissionId: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  collectionName?: string;

  @IsOptional()
  conditions?: Condition;
}

export class RoleBodyDto {
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => PermissionIdDto)
  permissions: PermissionIdDto[];
}
