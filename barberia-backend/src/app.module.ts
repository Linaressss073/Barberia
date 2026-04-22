import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { validateEnv } from '@config/env.validation';
import { appConfig } from '@config/app.config';
import { databaseConfig } from '@config/database.config';
import { jwtConfig } from '@config/jwt.config';

import { DatabaseModule } from '@infrastructure/database/database.module';
import { HealthModule } from '@infrastructure/http/health/health.module';

import { AllExceptionsFilter } from '@core/filters/all-exceptions.filter';
import { LoggingInterceptor } from '@core/interceptors/logging.interceptor';
import { TransformInterceptor } from '@core/interceptors/transform.interceptor';
import { RequestContextMiddleware } from '@core/middleware/request-context.middleware';

import { AuthModule } from '@modules/auth/auth.module';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { AuditModule } from '@modules/audit/audit.module';
import { AuditInterceptor } from '@modules/audit/application/audit.interceptor';
import { UsersModule } from '@modules/users/users.module';
import { CustomersModule } from '@modules/customers/customers.module';
import { BarbersModule } from '@modules/barbers/barbers.module';
import { ServicesModule } from '@modules/services/services.module';
import { MembershipsModule } from '@modules/memberships/memberships.module';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { AppointmentsModule } from '@modules/appointments/appointments.module';
import { SalesModule } from '@modules/sales/sales.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, databaseConfig, jwtConfig],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          ttl: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
          limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
        },
      ],
    }),
    DatabaseModule,
    HealthModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    BarbersModule,
    ServicesModule,
    MembershipsModule,
    InventoryModule,
    AppointmentsModule,
    SalesModule,
    ReportsModule,
    SettingsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: { enableImplicitConversion: true },
        }),
    },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
