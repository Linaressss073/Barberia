import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerDocument } from './customer.schema';

export class CustomerMapper {
  static toDomain(doc: CustomerDocument): Customer {
    return Customer.rehydrate(
      {
        userId: doc.userId ? new UniqueEntityId(doc.userId) : undefined,
        document: doc.document ?? undefined,
        fullName: doc.fullName,
        phone: doc.phone ?? undefined,
        birthdate: doc.birthdate ?? undefined,
        loyaltyPoints: doc.loyaltyPoints,
        preferences: doc.preferences ?? {},
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      new UniqueEntityId(doc._id),
    );
  }

  static toDoc(domain: Customer): Record<string, unknown> {
    return {
      _id: domain.id.value,
      userId: domain.userId?.value ?? null,
      document: domain.document ?? null,
      fullName: domain.fullName,
      phone: domain.phone ?? null,
      birthdate: domain.birthdate ?? null,
      loyaltyPoints: domain.loyaltyPoints,
      preferences: domain.preferences,
      deletedAt: null,
    };
  }
}
