import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigType } from '@nestjs/config';
import { Request } from 'express';
import { jwtConfig } from '@config/jwt.config';
import { AuthenticatedUser } from '@core/decorators/current-user.decorator';
import { Role } from '@core/decorators/roles.decorator';
import { requestContext } from '@core/context/request-context';
import { JWT_DENYLIST, JwtDenylist } from '../../application/ports/jwt-denylist.port';

interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
  tenantId?: string | null;
  jti: string;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(jwtConfig.KEY) cfg: ConfigType<typeof jwtConfig>,
    @Inject(JWT_DENYLIST) private readonly denylist: JwtDenylist,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.accessSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.jti) throw new UnauthorizedException('Token missing jti');
    if (await this.denylist.isRevoked(payload.jti)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const roles = payload.roles ?? [];
    const staffRoles: Role[] = [Role.Admin, Role.Barber, Role.Receptionist];
    const isStaff = roles.some((r) => staffRoles.includes(r as Role));

    let tenantId = payload.tenantId ?? null;
    if (!isStaff) {
      const raw = req.headers['x-tenant-id'];
      const headerVal =
        typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() : '';
      const uuidOk =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          headerVal,
        );
      if (uuidOk) tenantId = headerVal;
    }

    const ctx = requestContext.get();
    if (ctx) {
      ctx.userId = payload.sub;
      ctx.userEmail = payload.email;
      ctx.userRoles = roles;
      ctx.tenantId = tenantId;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      roles,
      tenantId,
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
