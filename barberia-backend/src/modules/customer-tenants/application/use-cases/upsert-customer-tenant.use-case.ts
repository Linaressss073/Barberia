import { Inject, Injectable } from '@nestjs/common';
import { CUSTOMER_TENANT_REPOSITORY, CustomerTenantRepository } from '../../domain/repositories/customer-tenant.repository';
import { CustomerTenant } from '../../domain/entities/customer-tenant.entity';

/** Used internally (e.g. after a booking) to ensure the record exists and record a visit. */
@Injectable()
export class UpsertCustomerTenantUseCase {
  constructor(
    @Inject(CUSTOMER_TENANT_REPOSITORY) private readonly repo: CustomerTenantRepository,
  ) {}

  async execute(customerId: string, tenantId: string, recordVisit = false): Promise<CustomerTenant> {
    let record = await this.repo.findByCustomerAndTenant(customerId, tenantId);
    if (!record) {
      record = CustomerTenant.create({ customerId, tenantId, isActive: false });
    }
    if (recordVisit) record.recordVisit();
    await this.repo.save(record);
    return record;
  }
}
