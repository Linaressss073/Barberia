import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDoc, TenantSchema } from './infrastructure/persistence/tenant.schema';
import { TenantsService } from './application/tenants.service';
import { TenantsController } from './presentation/tenants.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TenantDoc.name, schema: TenantSchema }]),
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService, MongooseModule],
})
export class TenantsModule {}
