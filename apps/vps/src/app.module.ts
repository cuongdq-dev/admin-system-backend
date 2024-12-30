import { configLoads } from '@app/modules';
import { TypeORMConfigFactory } from '@app/modules/database/typeorm.factory';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DockerModule } from './docker/docker.module';
import { RepositoryModule } from './repository/repository.module';
import { ServerModule } from './server/server.module';

const modules = [ServerModule, DockerModule, RepositoryModule];

export const global_modules = [
  ConfigModule.forRoot({
    load: configLoads,
    isGlobal: true,
    envFilePath: ['.env'],
  }),
  TypeOrmModule.forRootAsync({ useClass: TypeORMConfigFactory }),
];

@Module({
  imports: [...global_modules, ...modules],
})
export class VpsModule {}
