import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '@modules/auth/auth.module';
import { TenantsModule } from '@modules/tenants/tenants.module';
import { CustomerTenantDoc, CustomerTenantSchema } from './infrastructure/persistence/customer-tenant.schema';
import { MongoCustomerTenantRepository } from './infrastructure/persistence/customer-tenant.repository.impl';
import { CUSTOMER_TENANT_REPOSITORY } from './domain/repositories/customer-tenant.repository';
import { SetActiveTenantUseCase } from './application/use-cases/set-active-tenant.use-case';
import { GetMyTenantsUseCase } from './application/use-cases/get-my-tenants.use-case';
import { UpsertCustomerTenantUseCase } from './application/use-cases/upsert-customer-tenant.use-case';
import { CustomerTenantsController } from './presentation/customer-tenants.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CustomerTenantDoc.name, schema: CustomerTenantSchema }]),
    AuthModule,
    TenantsModule,
  ],
  controllers: [CustomerTenantsController],
  providers: [
    { provide: CUSTOMER_TENANT_REPOSITORY, useClass: MongoCustomerTenantRepository },
    SetActiveTenantUseCase,
    GetMyTenantsUseCase,
    UpsertCustomerTenantUseCase,
  ],
  exports: [CUSTOMER_TENANT_REPOSITORY, UpsertCustomerTenantUseCase, MongooseModule],
})
export class CustomerTenantsModule {}
