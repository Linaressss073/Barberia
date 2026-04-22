import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { EntityConflict } from '@core/exceptions/domain.exception';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepository,
} from '../../domain/repositories/customer.repository';
import { Customer } from '../../domain/entities/customer.entity';

export interface CreateCustomerInput {
  fullName: string;
  document?: string;
  phone?: string;
  birthdate?: Date;
  userId?: string;
  preferences?: Record<string, unknown>;
}

@Injectable()
export class CreateCustomerUseCase {
  constructor(@Inject(CUSTOMER_REPOSITORY) private readonly repo: CustomerRepository) {}

  async execute(input: CreateCustomerInput): Promise<Customer> {
    if (input.document) {
      const existing = await this.repo.findByDocument(input.document);
      if (existing) throw new EntityConflict('Customer with this document already exists');
    }
    const customer = Customer.create({
      fullName: input.fullName,
      document: input.document,
      phone: input.phone,
      birthdate: input.birthdate,
      userId: input.userId ? new UniqueEntityId(input.userId) : undefined,
      preferences: input.preferences,
    });
    await this.repo.save(customer);
    return customer;
  }
}
