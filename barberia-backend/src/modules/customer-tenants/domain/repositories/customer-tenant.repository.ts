import { CustomerTenant } from '../entities/customer-tenant.entity';

export const CUSTOMER_TENANT_REPOSITORY = Symbol('CUSTOMER_TENANT_REPOSITORY');

export interface CustomerTenantRepository {
  findByCustomerAndTenant(customerId: string, tenantId: string): Promise<CustomerTenant | null>;
  findActiveByCustomer(customerId: string): Promise<CustomerTenant | null>;
  findAllByCustomer(customerId: string): Promise<CustomerTenant[]>;
  deactivateAllForCustomer(customerId: string): Promise<void>;
  save(record: CustomerTenant): Promise<void>;
}
