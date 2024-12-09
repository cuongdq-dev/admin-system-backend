import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class EnvironmentVariable {
  @ApiProperty({ example: 'APP_NAME' })
  @IsString()
  @IsNotEmpty()
  variable: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

// Define the structure of the `volumes` array inside a service
class Volume {
  @ApiProperty({ example: '' })
  @IsString()
  hostPath: string;

  @ApiProperty({ example: '' })
  @IsString()
  containerPath: string;
}

// Define the structure of each service object
class Service {
  @ApiProperty({ example: 'test' })
  @IsString()
  serviceName: string;

  @ApiProperty({ example: '.' })
  @IsString()
  buildContext: string;

  @ApiProperty({ example: '.env' })
  @IsString()
  envFile: string;

  @ApiProperty({ type: [EnvironmentVariable] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnvironmentVariable) // Use `Type` to transform plain objects to class instances
  environment: EnvironmentVariable[];

  @ApiProperty({ type: [Volume] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Volume) // Use `Type` to transform plain objects to class instances
  volumes: Volume[];
}

export class CreateRepositoryDto {
  @ApiProperty({ example: 'contabo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'example' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'example@email.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'xxx' })
  @IsString()
  @IsNotEmpty()
  fine_grained_token: string;

  @ApiProperty({ example: '' })
  @IsString()
  @IsNotEmpty()
  github_url: string;

  @IsArray()
  services: Service[];
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
