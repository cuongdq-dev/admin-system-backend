import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { DataSource, FindOptionsRelations } from 'typeorm';

type IsIDExistPipeType = (options: {
  entity: EntityClassOrSchema;
  filterField?: string;
  relations?: FindOptionsRelations<any> | string[];
}) => any;

export const IsIDExistPipe: IsIDExistPipeType = ({
  entity,
  filterField = 'id',
  relations,
}) => {
  @Injectable()
  class IsIDExistMixinPipe implements PipeTransform {
    protected exceptionFactory: (error: string) => any;

    constructor(@InjectDataSource() private dataSource: DataSource) {}

    async transform(value: string) {
      const repository = this.dataSource.getRepository(entity);
      const instance = await repository.findOne({
        where: { [filterField]: value },
        relations: relations,
      });

      if (!instance) {
        throw new NotFoundException(
          `${filterField} ${value.toString()} of ${(entity as any).name} does not exists.`,
        );
      }

      return instance;
    }
  }
  return IsIDExistMixinPipe;
};
