import { loadEntities } from '@app/entities';
import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import ORMConfig from '../../../../ormconfig';

@Injectable()
export class TypeORMConfigFactory implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      ...ORMConfig.options,
      entities: loadEntities,
      autoLoadEntities: true,
      synchronize: true,
      keepConnectionAlive: true,
      retryAttempts: 5,
      retryDelay: 5000,
    };
  }
}
