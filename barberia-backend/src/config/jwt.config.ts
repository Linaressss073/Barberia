import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  accessSecret: string;
  accessTtl: string;
  refreshSecret: string;
  refreshTtl: string;
  bcryptRounds: number;
}

export const jwtConfig = registerAs<JwtConfig>('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  accessTtl: process.env.JWT_ACCESS_TTL ?? '900s',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
}));
