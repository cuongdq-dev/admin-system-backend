import { PostStatus } from '@app/entities/post.entity';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class CategoryIdDto {
  @IsUUID()
  id: string;
}
class SiteIdDto {
  @IsUUID()
  id: string;
}

export class PostBodyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => CategoryIdDto)
  categories: CategoryIdDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => SiteIdDto)
  sites: SiteIdDto[];
}

export class CreatePostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  created_by?: string;

  @IsOptional()
  @IsString()
  deleted_by?: string;

  @IsOptional()
  @IsString()
  updated_by?: string;

  @IsOptional()
  @IsString()
  meta_description?: string;

  @IsOptional()
  @IsArray()
  relatedQueries?: { id: string; title: string }[];

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  categories?: { id: string; title: string }[];

  @IsOptional()
  @IsArray()
  sites?: { id: string; title: string }[];

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}
