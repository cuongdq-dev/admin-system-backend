import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class UserUpdateDto {
  @ApiProperty({ example: 'Danimai', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  @ApiProperty({ example: 'Danimai', required: false })
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email: string;

  @ApiProperty({ example: 'Danimai', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  address: string;

  @ApiProperty({ example: 'Danimai', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  phoneNumber: string;
}
