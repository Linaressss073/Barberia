import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepository,
} from '../../domain/repositories/customer.repository';
import { Customer } from '../../domain/entities/customer.entity';
import { CreateCustomerUseCase } from './create-customer.use-case';
import { USER_REPOSITORY, UserRepository } from '@modules/auth/domain/repositories/user.repository';
import { EntityNotFound } from '@core/exceptions/domain.exception';

/**
 * Garantiza un perfil de cliente para usuarios con rol CUSTOMER (p. ej. cuentas
 * creadas antes de que existiera el vínculo customers.userId o si falló el alta en registro).
 */
@Injectable()
export class EnsureCustomerProfileUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly customers: CustomerRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly createCustomer: CreateCustomerUseCase,
  ) {}

  async execute(userId: string): Promise<Customer> {
    const uid = new UniqueEntityId(userId);
    const existing = await this.customers.findByUserId(uid);
    if (existing) return existing;

    const user = await this.users.findById(uid);
    if (!user) throw new EntityNotFound('User not found');

    try {
      return await this.createCustomer.execute({
        fullName: user.fullName,
        userId,
      });
    } catch (err: unknown) {
      const dup =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: number }).code === 11000;
      if (dup) {
        const again = await this.customers.findByUserId(uid);
        if (again) return again;
      }
      throw err;
    }
  }
}
