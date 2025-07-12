import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUUID,
  ValidateNested,
} from 'class-validator';

const strongPasswordConfig = {
  minLength: 8,
  minLowercase: 1,
  minNumbers: 1,
  minSymbols: 1,
  minUppercase: 1,
};

class RoleIdDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class UserUpdateDto {
  @ApiProperty({ example: 'example@danimai.com' })
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @IsStrongPassword(strongPasswordConfig)
  password: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @IsStrongPassword(strongPasswordConfig)
  confirmPassword: string;

  @ApiProperty({ example: 'Danimai' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'city 1' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: '+84xxxx' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({})
  @IsBoolean()
  @IsNotEmpty()
  is_active: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => RoleIdDto)
  roles: RoleIdDto[];
}
