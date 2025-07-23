import { ValidationGroup } from '@app/crud/validation-group';
import { SiteType } from '@app/entities/site.entity';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class CategoryIdDto {
  @IsUUID()
  id: string;
}

export class SiteBodyDto {
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  name: string;

  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  domain: string;

  @IsOptional()
  @IsObject()
  type?: { id?: SiteType; title?: SiteType };

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  autoPost?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => CategoryIdDto)
  categories: CategoryIdDto[];
}
