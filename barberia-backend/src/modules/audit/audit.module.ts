import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogOrmEntity } from './infrastructure/persistence/audit-log.orm-entity';
import { AuditService } from './application/audit.service';
import { AuditInterceptor } from './application/audit.interceptor';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogOrmEntity])],
  providers: [AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
