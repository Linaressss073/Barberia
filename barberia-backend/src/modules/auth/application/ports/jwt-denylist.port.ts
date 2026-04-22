export const JWT_DENYLIST = Symbol('JWT_DENYLIST');

export interface JwtDenylist {
  isRevoked(jti: string): Promise<boolean>;
  revoke(jti: string, expiresAt: Date): Promise<void>;
}
