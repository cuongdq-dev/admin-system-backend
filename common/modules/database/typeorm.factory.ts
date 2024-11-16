import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { loadEntities } from 'common/entities';
import ORMConfig from '../../../ormconfig';

@Injectable()
export class TypeORMConfigFactory implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      ...ORMConfig.options,
      entities: loadEntities,
      autoLoadEntities: true,
    };
  }
}
