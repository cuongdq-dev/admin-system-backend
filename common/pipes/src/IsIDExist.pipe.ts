import {
  Inject,
  Injectable,
  NotFoundException,
  PipeTransform,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { DataSource, FindOptionsRelations } from 'typeorm';

type IsIDExistPipeType = (options: {
  entity: EntityClassOrSchema;
  filterField?: string;
  checkOwner?: boolean;
  ownerField?: string;
  relations?: FindOptionsRelations<any> | string[];
}) => any;

export const IsIDExistPipe: IsIDExistPipeType = ({
  entity,
  filterField = 'id',
  checkOwner = false,
  ownerField = 'created_by',

  relations,
}) => {
  @Injectable()
  class IsIDExistMixinPipe implements PipeTransform {
    protected exceptionFactory: (error: string) => any;
    constructor(
      @InjectDataSource() private dataSource: DataSource,
      @Inject(REQUEST) private request: any,
    ) {}
    async transform(value: string) {
      const repository = this.dataSource.getRepository(entity);

      const where: any = { [filterField]: value };

      if (!!checkOwner) {
        const user = this.request?.user?.user || this.request?.user?.customer;
        if (!user?.id) {
          throw new UnauthorizedException('Unauthorized access');
        }

        where[ownerField] = user.id;
      }
      const instance = await repository.findOne({ where, relations });

      if (!instance) {
        throw new NotFoundException(
          `${(entity as any).name} with ${filterField} = "${value}" not found or access denied.`,
        );
      }

      return instance;
    }
  }
  return IsIDExistMixinPipe;
};
