import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  AccessTokenPayload,
  SignedAccessToken,
  TokenSigner,
} from '../../application/ports/token-signer.port';
import { jwtConfig } from '@config/jwt.config';

@Injectable()
export class JwtTokenSigner implements TokenSigner {
  constructor(
    private readonly jwt: JwtService,
    @Inject(jwtConfig.KEY) private readonly cfg: ConfigType<typeof jwtConfig>,
  ) {}

  async signAccessToken(payload: Omit<AccessTokenPayload, 'jti'>): Promise<SignedAccessToken> {
    const jti = randomUUID();
    const token = await this.jwt.signAsync(
      { ...payload, jti },
      { secret: this.cfg.accessSecret, expiresIn: this.cfg.accessTtl },
    );
    return {
      token,
      jti,
      expiresAt: new Date(Date.now() + this.accessTtlMs()),
    };
  }

  signRefreshToken(payload: { sub: string; jti: string }): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.cfg.refreshSecret,
      expiresIn: this.cfg.refreshTtl,
    });
  }

  refreshTtlMs(): number {
    return parseDurationToMs(this.cfg.refreshTtl);
  }

  accessTtlMs(): number {
    return parseDurationToMs(this.cfg.accessTtl);
  }
}

function parseDurationToMs(input: string): number {
  const m = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(input.trim());
  if (!m) return 15 * 60 * 1000;
  const n = parseInt(m[1], 10);
  switch (m[2] ?? 's') {
    case 'ms':
      return n;
    case 's':
      return n * 1000;
    case 'm':
      return n * 60 * 1000;
    case 'h':
      return n * 60 * 60 * 1000;
    case 'd':
      return n * 24 * 60 * 60 * 1000;
    default:
      return n * 1000;
  }
}
