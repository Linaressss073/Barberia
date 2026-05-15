import { AggregateRoot } from '@core/domain/aggregate-root';
import { UniqueEntityId } from '@core/domain/unique-entity-id';

interface CustomerTenantProps {
  customerId: string;
  tenantId: string;
  isActive: boolean;
  isFavorite: boolean;
  loyaltyPoints: number;
  visitCount: number;
  lastVisitedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerTenant extends AggregateRoot<CustomerTenantProps> {
  private constructor(props: CustomerTenantProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(
    params: { customerId: string; tenantId: string; isActive?: boolean },
    id?: UniqueEntityId,
  ): CustomerTenant {
    const now = new Date();
    return new CustomerTenant(
      {
        customerId: params.customerId,
        tenantId: params.tenantId,
        isActive: params.isActive ?? false,
        isFavorite: false,
        loyaltyPoints: 0,
        visitCount: 0,
        lastVisitedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  static rehydrate(props: CustomerTenantProps, id: UniqueEntityId): CustomerTenant {
    return new CustomerTenant(props, id);
  }

  get customerId(): string { return this.props.customerId; }
  get tenantId(): string { return this.props.tenantId; }
  get isActive(): boolean { return this.props.isActive; }
  get isFavorite(): boolean { return this.props.isFavorite; }
  get loyaltyPoints(): number { return this.props.loyaltyPoints; }
  get visitCount(): number { return this.props.visitCount; }
  get lastVisitedAt(): Date | null { return this.props.lastVisitedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  toggleFavorite(): void {
    this.props.isFavorite = !this.props.isFavorite;
    this.props.updatedAt = new Date();
  }

  recordVisit(): void {
    this.props.visitCount += 1;
    this.props.lastVisitedAt = new Date();
    this.props.updatedAt = new Date();
  }

  addLoyaltyPoints(amount: number): void {
    this.props.loyaltyPoints += amount;
    this.props.updatedAt = new Date();
  }
}
