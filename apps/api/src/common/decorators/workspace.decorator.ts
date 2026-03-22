import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const WorkspaceId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.headers['x-workspace-id'] ||
      request.user?.workspaceId ||
      request.params?.workspaceId
    );
  },
);

export const Roles = (...roles: string[]) => {
  return (target: object, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata('roles', roles, descriptor?.value || target);
    return descriptor;
  };
};

export const Public = () => {
  return (target: object, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata('isPublic', true, descriptor?.value || target);
    return descriptor;
  };
};
