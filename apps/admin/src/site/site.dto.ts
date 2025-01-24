import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CategoryIdDto {
  @IsUUID()
  id: string;
}

class PostIdDto {
  @IsUUID()
  id: string;
}

export class SiteCreateDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(255)
  domain: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true }) // Validate each item in the array
  @Type(() => CategoryIdDto) // Transform each item to CategoryIdDto
  categories: CategoryIdDto[];

  @IsArray()
  @ValidateNested({ each: true }) // Validate each item in the array
  @Type(() => PostIdDto) // Transform each item to PostIdDto
  posts: PostIdDto[];
}
