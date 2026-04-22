import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Membership } from './membership';

export const MEMBERSHIP_REPOSITORY = Symbol('MEMBERSHIP_REPOSITORY');

export interface MembershipRepository {
  findById(id: UniqueEntityId): Promise<Membership | null>;
  findActiveForCustomer(customerId: UniqueEntityId, at: Date): Promise<Membership | null>;
  listByCustomer(customerId: UniqueEntityId): Promise<Membership[]>;
  save(m: Membership): Promise<void>;
}
