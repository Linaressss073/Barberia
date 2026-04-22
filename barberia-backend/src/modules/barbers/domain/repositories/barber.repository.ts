import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Barber } from '../entities/barber.entity';

export const BARBER_REPOSITORY = Symbol('BARBER_REPOSITORY');

export interface BarberListFilter {
  page: number;
  limit: number;
  search?: string;
  onlyActive?: boolean;
}

export interface BarberRepository {
  findById(id: UniqueEntityId): Promise<Barber | null>;
  findByUserId(userId: UniqueEntityId): Promise<Barber | null>;
  save(barber: Barber): Promise<void>;
  paginate(filter: BarberListFilter): Promise<{ items: Barber[]; total: number }>;
  hasBlockOverlap(barberId: UniqueEntityId, startsAt: Date, endsAt: Date): Promise<boolean>;
  addBlock(barberId: UniqueEntityId, startsAt: Date, endsAt: Date, reason?: string): Promise<void>;
}
