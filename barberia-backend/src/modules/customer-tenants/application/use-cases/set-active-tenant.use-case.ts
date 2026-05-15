import { Inject, Injectable } from '@nestjs/common';
import { InvalidArgument } from '@core/exceptions/domain.exception';
import { requestContext } from '@core/context/request-context';
import { CUSTOMER_TENANT_REPOSITORY, CustomerTenantRepository } from '../../domain/repositories/customer-tenant.repository';
import { CustomerTenant } from '../../domain/entities/customer-tenant.entity';

@Injectable()
export class SetActiveTenantUseCase {
  constructor(
    @Inject(CUSTOMER_TENANT_REPOSITORY) private readonly repo: CustomerTenantRepository,
  ) {}

  async execute(tenantId: string): Promise<{ activeTenantId: string }> {
    const userId = requestContext.get()?.userId;
    if (!userId) throw new InvalidArgument('No user context');
    if (!tenantId) throw new InvalidArgument('tenantId is required');

    // Deactivate current active before activating the new one
    await this.repo.deactivateAllForCustomer(userId);

    let record = await this.repo.findByCustomerAndTenant(userId, tenantId);
    if (!record) {
      record = CustomerTenant.create({ customerId: userId, tenantId, isActive: true });
    } else {
      record.activate();
    }

    await this.repo.save(record);
    return { activeTenantId: tenantId };
  }
}
