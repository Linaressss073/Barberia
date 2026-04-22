import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Money } from '@shared/kernel/money.vo';
import { Service } from '../../domain/entities/service.entity';
import { ServiceOrmEntity } from './service.orm-entity';
import { ServicePromotionOrmEntity } from './service-promotion.orm-entity';

export class ServiceMapper {
  static toDomain(orm: ServiceOrmEntity): Service {
    const priceRes = Money.create(orm.priceCents);
    if (priceRes.isFailure) throw new Error('Invalid persisted price');
    return Service.rehydrate(
      {
        name: orm.name,
        description: orm.description ?? undefined,
        durationMin: orm.durationMin,
        price: priceRes.getValue(),
        active: orm.active,
        promotions: (orm.promotions ?? []).map((p) => ({
          id: new UniqueEntityId(p.id),
          name: p.name,
          discountPct: parseFloat(p.discountPct),
          validFrom: p.validFrom,
          validTo: p.validTo,
        })),
        createdAt: orm.createdAt,
        updatedAt: orm.updatedAt,
      },
      new UniqueEntityId(orm.id),
    );
  }

  static toOrm(domain: Service): ServiceOrmEntity {
    const orm = new ServiceOrmEntity();
    orm.id = domain.id.value;
    orm.name = domain.name;
    orm.description = domain.description ?? null;
    orm.durationMin = domain.durationMin;
    orm.priceCents = domain.price.amountCents;
    orm.active = domain.active;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.promotions = domain.promotions.map((p) => {
      const po = new ServicePromotionOrmEntity();
      po.id = p.id?.value ?? new UniqueEntityId().value;
      po.serviceId = domain.id.value;
      po.name = p.name;
      po.discountPct = p.discountPct.toFixed(2);
      po.validFrom = p.validFrom;
      po.validTo = p.validTo;
      return po;
    });
    return orm;
  }
}
