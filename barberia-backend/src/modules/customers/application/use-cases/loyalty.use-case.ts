import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { EntityNotFound } from '@core/exceptions/domain.exception';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepository,
} from '../../domain/repositories/customer.repository';
import { Customer } from '../../domain/entities/customer.entity';

@Injectable()
export class AddLoyaltyPointsUseCase {
  constructor(@Inject(CUSTOMER_REPOSITORY) private readonly repo: CustomerRepository) {}

  async execute(customerId: string, points: number): Promise<Customer> {
    const c = await this.repo.findById(new UniqueEntityId(customerId));
    if (!c) throw new EntityNotFound('Customer not found');
    c.addLoyaltyPoints(points);
    await this.repo.save(c);
    return c;
  }
}

@Injectable()
export class RedeemLoyaltyPointsUseCase {
  constructor(@Inject(CUSTOMER_REPOSITORY) private readonly repo: CustomerRepository) {}

  async execute(customerId: string, points: number): Promise<Customer> {
    const c = await this.repo.findById(new UniqueEntityId(customerId));
    if (!c) throw new EntityNotFound('Customer not found');
    c.redeemLoyaltyPoints(points);
    await this.repo.save(c);
    return c;
  }
}
