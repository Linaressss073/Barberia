import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  name: string;
  version: string;
  globalPrefix: string;
  frontendUrls: string[];
  throttle: { ttlMs: number; limit: number };
}

export const appConfig = registerAs<AppConfig>('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  name: process.env.APP_NAME ?? 'barberia-backend',
  version: process.env.APP_VERSION ?? '0.0.0',
  globalPrefix: process.env.GLOBAL_PREFIX ?? 'api/v1',
  frontendUrls: (process.env.FRONTEND_URL ?? 'http://localhost:4321')
    .split(',')
    .map((u) => u.trim()),
  throttle: {
    ttlMs: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
}));
