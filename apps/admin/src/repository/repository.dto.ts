import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRepositoryDto {
  @ApiProperty({ example: 'contabo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'example' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'example@email.com' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: 'xxx' })
  @IsNotEmpty()
  @IsString()
  fine_grained_token: string;

  @ApiProperty({ example: '' })
  @IsNotEmpty()
  @IsString()
  github_url: string;
}

export class UpdateRepositoryDto {
  @ApiProperty({ example: 'contabo' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'example' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'example@email.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'xxx' })
  @IsString()
  fine_grained_token: string;

  @ApiProperty({ example: '' })
  @IsString()
  github_url: string;
}
