import { UniqueEntityId } from './unique-entity-id';

export interface DomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: UniqueEntityId;
  readonly eventName: string;
}
