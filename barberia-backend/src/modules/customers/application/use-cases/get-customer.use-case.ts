import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { EntityNotFound } from '@core/exceptions/domain.exception';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepository,
} from '../../domain/repositories/customer.repository';
import { Customer } from '../../domain/entities/customer.entity';

@Injectable()
export class GetCustomerUseCase {
  constructor(@Inject(CUSTOMER_REPOSITORY) private readonly repo: CustomerRepository) {}

  async execute(id: string): Promise<Customer> {
    const c = await this.repo.findById(new UniqueEntityId(id));
    if (!c) throw new EntityNotFound('Customer not found');
    return c;
  }
}
