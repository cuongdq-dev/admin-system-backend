import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class ServerCreateDto {
  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'contabo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '192.127.1.1' })
  @IsString()
  @IsNotEmpty()
  host: string;

  @ApiProperty({ example: '22' })
  @IsString()
  @IsNotEmpty()
  port: string;

  @ApiProperty({ example: 'Danimai' })
  @IsString()
  @IsNotEmpty()
  user: string;
}

export class ServerUpdateDto {
  @ApiProperty({ example: 'Password@123' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'contabo' })
  @IsString()
  name: string;

  @ApiProperty({ example: '192.127.1.1' })
  @IsString()
  host: string;

  @ApiProperty({ example: '22' })
  @IsString()
  port: string;

  @ApiProperty({ example: 'Danimai' })
  @IsString()
  user: string;
}
