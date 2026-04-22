import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import {
  CustomerListFilter,
  CustomerRepository,
} from '../../domain/repositories/customer.repository';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerOrmEntity } from './customer.orm-entity';
import { CustomerMapper } from './customer.mapper';

@Injectable()
export class TypeOrmCustomerRepository implements CustomerRepository {
  constructor(
    @InjectRepository(CustomerOrmEntity) private readonly repo: Repository<CustomerOrmEntity>,
  ) {}

  async findById(id: UniqueEntityId): Promise<Customer | null> {
    const row = await this.repo.findOne({ where: { id: id.value } });
    return row ? CustomerMapper.toDomain(row) : null;
  }

  async findByDocument(document: string): Promise<Customer | null> {
    const row = await this.repo.findOne({ where: { document } });
    return row ? CustomerMapper.toDomain(row) : null;
  }

  async findByUserId(userId: UniqueEntityId): Promise<Customer | null> {
    const row = await this.repo.findOne({ where: { userId: userId.value } });
    return row ? CustomerMapper.toDomain(row) : null;
  }

  async save(customer: Customer): Promise<void> {
    await this.repo.save(CustomerMapper.toOrm(customer));
  }

  async paginate(filter: CustomerListFilter): Promise<{ items: Customer[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('c')
      .orderBy('c.created_at', 'DESC')
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit);
    if (filter.search) {
      qb.andWhere('(c.full_name ILIKE :s OR c.document ILIKE :s OR c.phone ILIKE :s)', {
        s: `%${filter.search}%`,
      });
    }
    const [rows, total] = await qb.getManyAndCount();
    return { items: rows.map(CustomerMapper.toDomain), total };
  }

  async softDelete(id: UniqueEntityId): Promise<void> {
    await this.repo.softDelete({ id: id.value });
  }
}
