import { ValidationGroup } from '@app/crud/validation-group';
import { CategoryStatus } from '@app/entities/category.entity';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class SiteIdDto {
  @IsUUID()
  id: string;
}

class PostIdDto {
  @IsUUID()
  id: string;
}

export class CategoryBodyDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  @IsOptional({ groups: [ValidationGroup.UPDATE] })
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => SiteIdDto)
  sites: SiteIdDto[];

  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => PostIdDto)
  posts: PostIdDto[];
}
