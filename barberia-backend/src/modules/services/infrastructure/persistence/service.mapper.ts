import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Money } from '@shared/kernel/money.vo';
import { Service } from '../../domain/entities/service.entity';
import { ServiceDocument } from './service.schema';

export class ServiceMapper {
  static toDomain(doc: ServiceDocument): Service {
    const priceRes = Money.create(doc.priceCents);
    if (priceRes.isFailure) throw new Error('Invalid persisted price');
    return Service.rehydrate(
      {
        name: doc.name,
        description: doc.description ?? undefined,
        durationMin: doc.durationMin,
        price: priceRes.getValue(),
        active: doc.active,
        promotions: (doc.promotions ?? []).map((p) => ({
          id: new UniqueEntityId(p.id),
          name: p.name,
          discountPct: parseFloat(p.discountPct),
          validFrom: p.validFrom,
          validTo: p.validTo,
        })),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      new UniqueEntityId(doc._id),
    );
  }

  static toDoc(domain: Service): Record<string, unknown> {
    return {
      _id: domain.id.value,
      name: domain.name,
      description: domain.description ?? null,
      durationMin: domain.durationMin,
      priceCents: domain.price.amountCents,
      active: domain.active,
      deletedAt: null,
      promotions: domain.promotions.map((p) => ({
        id: p.id?.value ?? new UniqueEntityId().value,
        name: p.name,
        discountPct: p.discountPct.toFixed(2),
        validFrom: p.validFrom,
        validTo: p.validTo,
      })),
    };
  }
}
