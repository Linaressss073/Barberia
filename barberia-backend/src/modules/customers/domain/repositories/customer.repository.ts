import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Customer } from '../entities/customer.entity';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface CustomerListFilter {
  page: number;
  limit: number;
  search?: string;
}

export interface CustomerRepository {
  findById(id: UniqueEntityId): Promise<Customer | null>;
  findByDocument(document: string): Promise<Customer | null>;
  findByUserId(userId: UniqueEntityId): Promise<Customer | null>;
  save(customer: Customer): Promise<void>;
  paginate(filter: CustomerListFilter): Promise<{ items: Customer[]; total: number }>;
  softDelete(id: UniqueEntityId): Promise<void>;
}
