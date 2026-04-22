import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { EntityNotFound } from '@core/exceptions/domain.exception';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepository,
} from '../../domain/repositories/customer.repository';
import { Customer } from '../../domain/entities/customer.entity';

export interface UpdateCustomerInput {
  id: string;
  fullName?: string;
  phone?: string;
  birthdate?: Date;
  preferences?: Record<string, unknown>;
}

@Injectable()
export class UpdateCustomerUseCase {
  constructor(@Inject(CUSTOMER_REPOSITORY) private readonly repo: CustomerRepository) {}

  async execute(input: UpdateCustomerInput): Promise<Customer> {
    const c = await this.repo.findById(new UniqueEntityId(input.id));
    if (!c) throw new EntityNotFound('Customer not found');
    c.updateProfile({
      fullName: input.fullName,
      phone: input.phone,
      birthdate: input.birthdate,
      preferences: input.preferences,
    });
    await this.repo.save(c);
    return c;
  }
}
