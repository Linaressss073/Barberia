import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { ServiceListFilter, ServiceRepository } from '../../domain/repositories/service.repository';
import { Service } from '../../domain/entities/service.entity';
import { ServiceOrmEntity } from './service.orm-entity';
import { ServicePromotionOrmEntity } from './service-promotion.orm-entity';
import { ServiceMapper } from './service.mapper';

@Injectable()
export class TypeOrmServiceRepository implements ServiceRepository {
  constructor(
    @InjectRepository(ServiceOrmEntity) private readonly repo: Repository<ServiceOrmEntity>,
    @InjectRepository(ServicePromotionOrmEntity)
    private readonly promos: Repository<ServicePromotionOrmEntity>,
  ) {}

  async findById(id: UniqueEntityId): Promise<Service | null> {
    const row = await this.repo.findOne({ where: { id: id.value } });
    return row ? ServiceMapper.toDomain(row) : null;
  }

  async findManyByIds(ids: UniqueEntityId[]): Promise<Service[]> {
    if (ids.length === 0) return [];
    const rows = await this.repo.find({ where: { id: In(ids.map((i) => i.value)) } });
    return rows.map(ServiceMapper.toDomain);
  }

  async save(svc: Service): Promise<void> {
    await this.promos.delete({ serviceId: svc.id.value });
    await this.repo.save(ServiceMapper.toOrm(svc));
  }

  async paginate(filter: ServiceListFilter): Promise<{ items: Service[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.promotions', 'p')
      .orderBy('s.name', 'ASC')
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit);
    if (filter.search) qb.andWhere('s.name ILIKE :s', { s: `%${filter.search}%` });
    if (filter.onlyActive) qb.andWhere('s.active = true');
    const [rows, total] = await qb.getManyAndCount();
    return { items: rows.map(ServiceMapper.toDomain), total };
  }

  async softDelete(id: UniqueEntityId): Promise<void> {
    await this.repo.softDelete({ id: id.value });
  }
}
