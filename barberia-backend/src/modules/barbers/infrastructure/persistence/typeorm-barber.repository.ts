import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { BarberListFilter, BarberRepository } from '../../domain/repositories/barber.repository';
import { Barber } from '../../domain/entities/barber.entity';
import { BarberOrmEntity } from './barber.orm-entity';
import { BarberScheduleOrmEntity } from './barber-schedule.orm-entity';
import { BarberBlockOrmEntity } from './barber-block.orm-entity';
import { BarberMapper } from './barber.mapper';

@Injectable()
export class TypeOrmBarberRepository implements BarberRepository {
  constructor(
    @InjectRepository(BarberOrmEntity) private readonly repo: Repository<BarberOrmEntity>,
    @InjectRepository(BarberScheduleOrmEntity)
    private readonly schedules: Repository<BarberScheduleOrmEntity>,
    @InjectRepository(BarberBlockOrmEntity)
    private readonly blocks: Repository<BarberBlockOrmEntity>,
  ) {}

  async findById(id: UniqueEntityId): Promise<Barber | null> {
    const row = await this.repo.findOne({ where: { id: id.value } });
    return row ? BarberMapper.toDomain(row) : null;
  }

  async findByUserId(userId: UniqueEntityId): Promise<Barber | null> {
    const row = await this.repo.findOne({ where: { userId: userId.value } });
    return row ? BarberMapper.toDomain(row) : null;
  }

  async save(barber: Barber): Promise<void> {
    const orm = BarberMapper.toOrm(barber);
    // Replace schedules atomically.
    await this.schedules.delete({ barberId: barber.id.value });
    await this.repo.save(orm);
  }

  async paginate(filter: BarberListFilter): Promise<{ items: Barber[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.schedules', 's')
      .orderBy('b.created_at', 'DESC')
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit);
    if (filter.search) {
      qb.andWhere('(b.display_name ILIKE :s OR b.specialty ILIKE :s)', {
        s: `%${filter.search}%`,
      });
    }
    if (filter.onlyActive) qb.andWhere('b.active = true');
    const [rows, total] = await qb.getManyAndCount();
    return { items: rows.map(BarberMapper.toDomain), total };
  }

  async hasBlockOverlap(barberId: UniqueEntityId, startsAt: Date, endsAt: Date): Promise<boolean> {
    const count = await this.blocks
      .createQueryBuilder('b')
      .where('b.barber_id = :id', { id: barberId.value })
      .andWhere("tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(:s, :e, '[)')", {
        s: startsAt,
        e: endsAt,
      })
      .getCount();
    return count > 0;
  }

  async addBlock(
    barberId: UniqueEntityId,
    startsAt: Date,
    endsAt: Date,
    reason?: string,
  ): Promise<void> {
    await this.blocks.insert({
      barberId: barberId.value,
      startsAt,
      endsAt,
      reason: reason ?? null,
    });
  }
}
