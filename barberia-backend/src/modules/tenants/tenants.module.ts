import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDoc, TenantSchema } from './infrastructure/persistence/tenant.schema';
import { ServiceDoc, ServiceSchema } from '@modules/services/infrastructure/persistence/service.schema';
import { BarberDoc, BarberSchema } from '@modules/barbers/infrastructure/persistence/barber.schema';
import { TenantsService } from './application/tenants.service';
import { TenantsController } from './presentation/tenants.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TenantDoc.name, schema: TenantSchema },
      { name: ServiceDoc.name, schema: ServiceSchema },
      { name: BarberDoc.name, schema: BarberSchema },
    ]),
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService, MongooseModule],
})
export class TenantsModule {}
