import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentOrmEntity } from '../infrastructure/persistence/appointment.orm-entity';
import { Page, buildPage } from '@shared/pagination/pagination.dto';

export interface ListAppointmentsInput {
  page: number;
  limit: number;
  barberId?: string;
  customerId?: string;
  status?: string;
  from?: Date;
  to?: Date;
}

@Injectable()
export class ListAppointmentsUseCase {
  constructor(
    @InjectRepository(AppointmentOrmEntity)
    private readonly repo: Repository<AppointmentOrmEntity>,
  ) {}

  async execute(input: ListAppointmentsInput): Promise<Page<AppointmentOrmEntity>> {
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.items', 'i')
      .orderBy('a.scheduled_at', 'DESC')
      .skip((input.page - 1) * input.limit)
      .take(input.limit);
    if (input.barberId) qb.andWhere('a.barber_id = :b', { b: input.barberId });
    if (input.customerId) qb.andWhere('a.customer_id = :c', { c: input.customerId });
    if (input.status) qb.andWhere('a.status = :s', { s: input.status });
    if (input.from) qb.andWhere('a.scheduled_at >= :f', { f: input.from });
    if (input.to) qb.andWhere('a.scheduled_at < :t', { t: input.to });

    const [items, total] = await qb.getManyAndCount();
    return buildPage(items, total, input.page, input.limit);
  }
}
