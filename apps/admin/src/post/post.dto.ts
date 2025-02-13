import { Type } from 'class-transformer';
import {
  IsString,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { ValidationGroup } from 'common/crud';

// TRENDING
interface ITrendingArticle {
  id?: string;
  title: string;
  source: string;
  url: string;
  image?: ITrendingImage;
}

interface ITrendingImage {
  id?: string;
  newsUrl: string;
  source: string;
  imageUrl: string;
}

interface ITrending {
  id?: string;
  title: { query: string; exploreLink: string };
  formattedTraffic: string;
  relatedQueries: { query?: string }[];
  image?: ITrendingImage;
  articles: ITrendingArticle[];
}

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
