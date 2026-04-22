import { DomainEvent } from './domain-event';
import { Entity } from './entity';

/**
 * Raíz de Agregado. Mantiene una lista de eventos de dominio
 * que serán despachados tras commit transaccional (outbox pattern simplificado).
 */
export abstract class AggregateRoot<TProps> extends Entity<TProps> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
