import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
  ssl: boolean;
  logging: boolean;
  poolMax: number;
}

export const databaseConfig = registerAs<DatabaseConfig>('database', () => ({
  url: process.env.DATABASE_URL ?? '',
  ssl: (process.env.DATABASE_SSL ?? 'true').toLowerCase() === 'true',
  logging: (process.env.DATABASE_LOGGING ?? 'false').toLowerCase() === 'true',
  poolMax: parseInt(process.env.DATABASE_POOL_MAX ?? '10', 10),
}));
