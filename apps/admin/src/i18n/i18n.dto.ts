import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class I18nUpdateDto {
  @ApiProperty({ example: 'I18n text......', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  content: string;
}
