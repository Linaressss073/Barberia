import { Inject, Injectable } from '@nestjs/common';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepository,
} from '../../domain/repositories/customer.repository';
import { Page, buildPage } from '@shared/pagination/pagination.dto';
import { Customer } from '../../domain/entities/customer.entity';

@Injectable()
export class ListCustomersUseCase {
  constructor(@Inject(CUSTOMER_REPOSITORY) private readonly repo: CustomerRepository) {}

  async execute(input: { page: number; limit: number; search?: string }): Promise<Page<Customer>> {
    const { items, total } = await this.repo.paginate(input);
    return buildPage(items, total, input.page, input.limit);
  }
}
