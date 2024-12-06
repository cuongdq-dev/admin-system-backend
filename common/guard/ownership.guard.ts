import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dataSource: DataSource, // Inject dataSource
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user.user;
    const entityId = request.params.id;

    const entity = this.reflector.get('entity', context.getHandler());
    const owner_key = this.reflector.get('owner_key', context.getHandler());
    const repository = this.dataSource.getRepository(entity);

    return repository
      .findOne({ where: { id: entityId } })
      .then((entityInstance) => {
        if (!entityInstance) {
          throw new ForbiddenException(
            `${entity.name} with ID ${entityId} does not exist.`,
          );
        }

        if (entityInstance[owner_key || 'owner_id'] !== user.id) {
          throw new ForbiddenException(
            'You do not have permission to update this resource.',
          );
        }

        return true;
      });
  }
}
