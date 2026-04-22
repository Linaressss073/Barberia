import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DatabaseConfig } from '@config/database.config';
import { SnakeCaseNamingStrategy } from './naming.strategy';
import { UnitOfWork } from './unit-of-work';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const db = config.getOrThrow<DatabaseConfig>('database');
        return {
          type: 'postgres',
          url: db.url,
          ssl: db.ssl ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          synchronize: false,
          logging: db.logging,
          namingStrategy: new SnakeCaseNamingStrategy(),
          migrationsRun: false,
          extra: {
            max: db.poolMax,
            connectionTimeoutMillis: 10_000,
            idleTimeoutMillis: 30_000,
          },
          retryAttempts: 5,
          retryDelay: 3000,
        };
      },
    }),
  ],
  providers: [UnitOfWork],
  exports: [UnitOfWork],
})
export class DatabaseModule {}
