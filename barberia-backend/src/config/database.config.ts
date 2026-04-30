import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  uri: string;
}

export const databaseConfig = registerAs<DatabaseConfig>('database', () => ({
  uri: process.env.DATABASE_URL ?? '',
}));
