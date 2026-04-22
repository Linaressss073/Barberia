import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Service } from '../entities/service.entity';

export const SERVICE_REPOSITORY = Symbol('SERVICE_REPOSITORY');

export interface ServiceListFilter {
  page: number;
  limit: number;
  search?: string;
  onlyActive?: boolean;
}

export interface ServiceRepository {
  findById(id: UniqueEntityId): Promise<Service | null>;
  findManyByIds(ids: UniqueEntityId[]): Promise<Service[]>;
  save(svc: Service): Promise<void>;
  paginate(filter: ServiceListFilter): Promise<{ items: Service[]; total: number }>;
  softDelete(id: UniqueEntityId): Promise<void>;
}
