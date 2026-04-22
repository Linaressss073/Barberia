import { Role } from '@core/decorators/roles.decorator';

export const TOKEN_SIGNER = Symbol('TOKEN_SIGNER');

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: Role[];
  jti: string;
}

export interface SignedAccessToken {
  token: string;
  jti: string;
  expiresAt: Date;
}

export interface TokenSigner {
  signAccessToken(payload: Omit<AccessTokenPayload, 'jti'>): Promise<SignedAccessToken>;
  signRefreshToken(payload: { sub: string; jti: string }): Promise<string>;
  refreshTtlMs(): number;
  accessTtlMs(): number;
}
