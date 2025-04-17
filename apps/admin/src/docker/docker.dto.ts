import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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

  @ApiProperty({ example: 'fine_grained_token' })
  @IsNotEmpty()
  @IsString()
  fine_grained_token: string;

  @ApiProperty({ example: 'https://github_url.com' })
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

  @ApiProperty({ example: 'fine_grained_token' })
  @IsString()
  fine_grained_token: string;

  @ApiProperty({ example: 'github_url' })
  @IsString()
  github_url: string;
}

export class RunDockerDto {
  imageName: string;
  imageId: string;
  serverPath: string;
  serviceName: string;
}
