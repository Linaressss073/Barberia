import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeCaseNamingStrategy } from './naming.strategy';

dotenv.config();

const sslEnabled = (process.env.DATABASE_SSL ?? 'true').toLowerCase() === 'true';

/**
 * DataSource utilizado por:
 *  - El CLI de TypeORM (migraciones).
 *  - El TypeOrmModule en runtime (vía database.module.ts).
 *
 * IMPORTANTE: synchronize=false SIEMPRE. Migraciones son la única fuente de verdad.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: (process.env.DATABASE_LOGGING ?? 'false').toLowerCase() === 'true',
  namingStrategy: new SnakeCaseNamingStrategy(),
  entities: [__dirname + '/../../modules/**/infrastructure/persistence/*.orm-entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'typeorm_migrations',
  extra: {
    max: parseInt(process.env.DATABASE_POOL_MAX ?? '10', 10),
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  },
};

export default new DataSource(dataSourceOptions);
