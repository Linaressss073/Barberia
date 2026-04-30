import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLogDoc, AuditLogSchema } from './infrastructure/persistence/audit-log.schema';
import { AuditService } from './application/audit.service';
import { AuditInterceptor } from './application/audit.interceptor';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: AuditLogDoc.name, schema: AuditLogSchema }])],
  providers: [AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
