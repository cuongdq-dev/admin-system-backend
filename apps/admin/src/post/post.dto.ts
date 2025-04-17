import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';

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
