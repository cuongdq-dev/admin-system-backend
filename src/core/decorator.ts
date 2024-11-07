import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { Request } from 'express';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const DecoratorBoolean = () =>
  Transform(
    ({ value }) => {
      return value === 'true' || value === '1';
    },
    { toClassOnly: true }
  );

export const ClientPlatform = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.get('platform');
});
