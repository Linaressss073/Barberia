import { AggregateRoot } from '@core/domain/aggregate-root';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { BusinessRuleViolation, InvalidArgument } from '@core/exceptions/domain.exception';

interface CustomerProps {
  userId?: UniqueEntityId;
  document?: string;
  fullName: string;
  phone?: string;
  birthdate?: Date;
  loyaltyPoints: number;
  preferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Customer extends AggregateRoot<CustomerProps> {
  private constructor(props: CustomerProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(
    params: {
      fullName: string;
      userId?: UniqueEntityId;
      document?: string;
      phone?: string;
      birthdate?: Date;
      preferences?: Record<string, unknown>;
    },
    id?: UniqueEntityId,
  ): Customer {
    if (!params.fullName || params.fullName.trim().length < 2) {
      throw new InvalidArgument('fullName must have at least 2 chars');
    }
    const now = new Date();
    return new Customer(
      {
        userId: params.userId,
        document: params.document?.trim() || undefined,
        fullName: params.fullName.trim(),
        phone: params.phone?.trim() || undefined,
        birthdate: params.birthdate,
        loyaltyPoints: 0,
        preferences: params.preferences ?? {},
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  static rehydrate(props: CustomerProps, id: UniqueEntityId): Customer {
    return new Customer(props, id);
  }

  get fullName(): string {
    return this.props.fullName;
  }
  get document(): string | undefined {
    return this.props.document;
  }
  get phone(): string | undefined {
    return this.props.phone;
  }
  get birthdate(): Date | undefined {
    return this.props.birthdate;
  }
  get loyaltyPoints(): number {
    return this.props.loyaltyPoints;
  }
  get preferences(): Record<string, unknown> {
    return { ...this.props.preferences };
  }
  get userId(): UniqueEntityId | undefined {
    return this.props.userId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateProfile(
    patch: Partial<{
      fullName: string;
      phone: string;
      birthdate: Date;
      preferences: Record<string, unknown>;
    }>,
  ): void {
    if (patch.fullName !== undefined) {
      if (patch.fullName.trim().length < 2) throw new InvalidArgument('fullName too short');
      this.props.fullName = patch.fullName.trim();
    }
    if (patch.phone !== undefined) this.props.phone = patch.phone.trim() || undefined;
    if (patch.birthdate !== undefined) this.props.birthdate = patch.birthdate;
    if (patch.preferences !== undefined) this.props.preferences = patch.preferences;
    this.props.updatedAt = new Date();
  }

  addLoyaltyPoints(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0)
      throw new InvalidArgument('amount must be positive integer');
    this.props.loyaltyPoints += amount;
    this.props.updatedAt = new Date();
  }

  redeemLoyaltyPoints(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0)
      throw new InvalidArgument('amount must be positive integer');
    if (this.props.loyaltyPoints < amount) {
      throw new BusinessRuleViolation('Insufficient loyalty points', {
        have: this.props.loyaltyPoints,
        need: amount,
      });
    }
    this.props.loyaltyPoints -= amount;
    this.props.updatedAt = new Date();
  }
}
