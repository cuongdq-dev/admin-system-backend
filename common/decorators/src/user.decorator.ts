import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserParam = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.user || request.user?.customer;
  },
);

export const BodyWithUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const method = request.method;
    const user = request.user?.user || request.user?.customer;
    const userId = user?.id;
    const body = request.body;

    if (!userId) return body;

    if (method === 'POST') {
      return { ...body, created_by: userId };
    }

    if (method === 'PATCH' || method === 'PUT') {
      return { ...body, updated_by: userId };
    }

    if (method === 'DELETE') {
      return { ...body, deleted_by: userId };
    }

    return body;
  },
);
