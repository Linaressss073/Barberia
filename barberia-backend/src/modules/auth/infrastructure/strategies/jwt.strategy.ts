import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigType } from '@nestjs/config';
import { jwtConfig } from '@config/jwt.config';
import { AuthenticatedUser } from '@core/decorators/current-user.decorator';
import { Role } from '@core/decorators/roles.decorator';
import { requestContext } from '@core/context/request-context';
import { JWT_DENYLIST, JwtDenylist } from '../../application/ports/jwt-denylist.port';

interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
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
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.jti) throw new UnauthorizedException('Token missing jti');
    if (await this.denylist.isRevoked(payload.jti)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const ctx = requestContext.get();
    if (ctx) {
      ctx.userId = payload.sub;
      ctx.userEmail = payload.email;
      ctx.userRoles = payload.roles ?? [];
    }

    return {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles ?? [],
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
