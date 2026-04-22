import { AggregateRoot } from '@core/domain/aggregate-root';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { InvalidArgument } from '@core/exceptions/domain.exception';

interface MembershipProps {
  customerId: UniqueEntityId;
  plan: string;
  startsAt: Date;
  endsAt: Date;
  discountPct: number;
  active: boolean;
  createdAt: Date;
}

export class Membership extends AggregateRoot<MembershipProps> {
  private constructor(props: MembershipProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(params: {
    customerId: UniqueEntityId;
    plan: string;
    startsAt: Date;
    endsAt: Date;
    discountPct: number;
  }): Membership {
    if (params.endsAt <= params.startsAt)
      throw new InvalidArgument('endsAt must be after startsAt');
    if (params.discountPct < 0 || params.discountPct > 100) {
      throw new InvalidArgument('discountPct must be 0..100');
    }
    return new Membership({
      ...params,
      active: true,
      createdAt: new Date(),
    });
  }

  static rehydrate(props: MembershipProps, id: UniqueEntityId): Membership {
    return new Membership(props, id);
  }

  cancel(): void {
    this.props.active = false;
  }

  isActiveAt(at: Date): boolean {
    return this.props.active && this.props.startsAt <= at && at < this.props.endsAt;
  }

  get customerId(): UniqueEntityId {
    return this.props.customerId;
  }
  get plan(): string {
    return this.props.plan;
  }
  get startsAt(): Date {
    return this.props.startsAt;
  }
  get endsAt(): Date {
    return this.props.endsAt;
  }
  get discountPct(): number {
    return this.props.discountPct;
  }
  get active(): boolean {
    return this.props.active;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
