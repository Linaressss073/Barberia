import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Forbidden } from '@core/exceptions/domain.exception';
import { ROLES_KEY, Role } from '@core/decorators/roles.decorator';
import { AuthenticatedUser } from '@core/decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!user) throw new Forbidden('Missing authenticated user');

    const has = user.roles.some((r) => required.includes(r as Role));
    if (!has) throw new Forbidden('Insufficient role privileges', { required, have: user.roles });
    return true;
  }
}
