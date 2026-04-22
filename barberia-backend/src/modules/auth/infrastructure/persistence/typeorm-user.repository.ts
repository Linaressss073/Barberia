import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Email } from '@shared/kernel/email.vo';
import { UserListFilter, UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from './user.orm-entity';
import { UserMapper } from './user.mapper';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async findById(id: UniqueEntityId): Promise<User | null> {
    const row = await this.repo.findOne({ where: { id: id.value } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.repo.findOne({ where: { email: email.value } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.repo.count({ where: { email: email.value } });
    return count > 0;
  }

  async save(user: User): Promise<void> {
    await this.repo.save(UserMapper.toOrm(user));
  }

  async paginate(filter: UserListFilter): Promise<{ items: User[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('u')
      .where('u.deleted_at IS NULL')
      .orderBy('u.created_at', 'DESC')
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit);

    if (filter.search) {
      qb.andWhere('(u.email ILIKE :s OR u.full_name ILIKE :s)', { s: `%${filter.search}%` });
    }
    if (filter.status) qb.andWhere('u.status = :st', { st: filter.status });
    if (filter.role) qb.andWhere(':r = ANY(u.roles)', { r: filter.role });

    const [rows, total] = await qb.getManyAndCount();
    // ILike used to keep import (no-op if no search). Avoids unused import warnings:
    void ILike;
    return { items: rows.map(UserMapper.toDomain), total };
  }
}
