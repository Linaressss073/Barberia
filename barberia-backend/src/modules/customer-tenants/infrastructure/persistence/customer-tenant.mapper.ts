import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { CustomerTenant } from '../../domain/entities/customer-tenant.entity';
import { CustomerTenantDocument } from './customer-tenant.schema';

export class CustomerTenantMapper {
  static toDomain(doc: CustomerTenantDocument): CustomerTenant {
    return CustomerTenant.rehydrate(
      {
        customerId: doc.customerId,
        tenantId: doc.tenantId,
        isActive: doc.isActive,
        isFavorite: doc.isFavorite,
        loyaltyPoints: doc.loyaltyPoints,
        visitCount: doc.visitCount,
        lastVisitedAt: doc.lastVisitedAt ?? null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      new UniqueEntityId(doc._id),
    );
  }

  static toDoc(domain: CustomerTenant): Record<string, unknown> {
    return {
      _id: domain.id.value,
      customerId: domain.customerId,
      tenantId: domain.tenantId,
      isActive: domain.isActive,
      isFavorite: domain.isFavorite,
      loyaltyPoints: domain.loyaltyPoints,
      visitCount: domain.visitCount,
      lastVisitedAt: domain.lastVisitedAt,
    };
  }
}
