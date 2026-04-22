import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerOrmEntity } from './customer.orm-entity';

export class CustomerMapper {
  static toDomain(orm: CustomerOrmEntity): Customer {
    return Customer.rehydrate(
      {
        userId: orm.userId ? new UniqueEntityId(orm.userId) : undefined,
        document: orm.document ?? undefined,
        fullName: orm.fullName,
        phone: orm.phone ?? undefined,
        birthdate: orm.birthdate ?? undefined,
        loyaltyPoints: orm.loyaltyPoints,
        preferences: orm.preferences ?? {},
        createdAt: orm.createdAt,
        updatedAt: orm.updatedAt,
      },
      new UniqueEntityId(orm.id),
    );
  }

  static toOrm(domain: Customer): CustomerOrmEntity {
    const orm = new CustomerOrmEntity();
    orm.id = domain.id.value;
    orm.userId = domain.userId?.value ?? null;
    orm.document = domain.document ?? null;
    orm.fullName = domain.fullName;
    orm.phone = domain.phone ?? null;
    orm.birthdate = domain.birthdate ?? null;
    orm.loyaltyPoints = domain.loyaltyPoints;
    orm.preferences = domain.preferences;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.deletedAt = null;
    return orm;
  }
}
