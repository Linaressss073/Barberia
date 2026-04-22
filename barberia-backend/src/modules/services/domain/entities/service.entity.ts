import { AggregateRoot } from '@core/domain/aggregate-root';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { InvalidArgument } from '@core/exceptions/domain.exception';
import { Money } from '@shared/kernel/money.vo';

export interface PromotionProps {
  id?: UniqueEntityId;
  name: string;
  discountPct: number;
  validFrom: Date;
  validTo: Date;
}

interface ServiceProps {
  name: string;
  description?: string;
  durationMin: number;
  price: Money;
  active: boolean;
  promotions: PromotionProps[];
  createdAt: Date;
  updatedAt: Date;
}

export class Service extends AggregateRoot<ServiceProps> {
  private constructor(props: ServiceProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(
    params: {
      name: string;
      description?: string;
      durationMin: number;
      priceCents: number;
      currency?: string;
    },
    id?: UniqueEntityId,
  ): Service {
    if (!params.name || params.name.trim().length < 2) throw new InvalidArgument('name too short');
    if (params.durationMin <= 0 || params.durationMin > 600) {
      throw new InvalidArgument('durationMin must be 1..600');
    }
    const priceRes = Money.create(params.priceCents, params.currency ?? 'PEN');
    if (priceRes.isFailure) throw new InvalidArgument(priceRes.getError());
    const now = new Date();
    return new Service(
      {
        name: params.name.trim(),
        description: params.description?.trim() || undefined,
        durationMin: params.durationMin,
        price: priceRes.getValue(),
        active: true,
        promotions: [],
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  static rehydrate(props: ServiceProps, id: UniqueEntityId): Service {
    return new Service(props, id);
  }

  get name(): string {
    return this.props.name;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get durationMin(): number {
    return this.props.durationMin;
  }
  get price(): Money {
    return this.props.price;
  }
  get active(): boolean {
    return this.props.active;
  }
  get promotions(): PromotionProps[] {
    return [...this.props.promotions];
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(
    patch: Partial<{
      name: string;
      description: string;
      durationMin: number;
      priceCents: number;
      active: boolean;
    }>,
  ): void {
    if (patch.name !== undefined) {
      if (patch.name.trim().length < 2) throw new InvalidArgument('name too short');
      this.props.name = patch.name.trim();
    }
    if (patch.description !== undefined)
      this.props.description = patch.description.trim() || undefined;
    if (patch.durationMin !== undefined) {
      if (patch.durationMin <= 0 || patch.durationMin > 600) {
        throw new InvalidArgument('durationMin must be 1..600');
      }
      this.props.durationMin = patch.durationMin;
    }
    if (patch.priceCents !== undefined) {
      const r = Money.create(patch.priceCents, this.props.price.currency);
      if (r.isFailure) throw new InvalidArgument(r.getError());
      this.props.price = r.getValue();
    }
    if (patch.active !== undefined) this.props.active = patch.active;
    this.props.updatedAt = new Date();
  }

  addPromotion(p: Omit<PromotionProps, 'id'>): void {
    if (p.discountPct < 0 || p.discountPct > 100)
      throw new InvalidArgument('discountPct must be 0..100');
    if (p.validTo <= p.validFrom) throw new InvalidArgument('validTo must be after validFrom');
    this.props.promotions.push({ ...p, id: new UniqueEntityId() });
    this.props.updatedAt = new Date();
  }

  /** Best discount currently active (returns Money applied to price). */
  effectivePriceAt(at: Date = new Date()): Money {
    const active = this.props.promotions.filter((p) => p.validFrom <= at && p.validTo > at);
    if (active.length === 0) return this.props.price;
    const best = active.reduce((max, p) => (p.discountPct > max ? p.discountPct : max), 0);
    return this.props.price.applyDiscountPct(best);
  }
}
