import {
  IsArray,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidationGroup } from '@app/crud/validation-group';

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

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => PostIdDto)
  posts: PostIdDto[];
}
