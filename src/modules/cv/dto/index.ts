import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class KeywordDto {
  @IsNotEmpty()
  @IsString()
  text: string;

  @IsOptional()
  @IsNumber()
  count: number;
}
