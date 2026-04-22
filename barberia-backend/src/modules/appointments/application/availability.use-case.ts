import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityNotFound } from '@core/exceptions/domain.exception';
import { AppointmentOrmEntity } from '../infrastructure/persistence/appointment.orm-entity';
import { BarberOrmEntity } from '@modules/barbers/infrastructure/persistence/barber.orm-entity';
import { BarberBlockOrmEntity } from '@modules/barbers/infrastructure/persistence/barber-block.orm-entity';

export interface AvailabilitySlot {
  startsAt: string; // ISO
  endsAt: string;
}

const SLOT_MINUTES = 30;

@Injectable()
export class GetAvailabilityUseCase {
  constructor(
    @InjectRepository(AppointmentOrmEntity)
    private readonly appts: Repository<AppointmentOrmEntity>,
    @InjectRepository(BarberOrmEntity)
    private readonly barbers: Repository<BarberOrmEntity>,
    @InjectRepository(BarberBlockOrmEntity)
    private readonly blocks: Repository<BarberBlockOrmEntity>,
  ) {}

  async execute(input: {
    barberId: string;
    date: Date;
    durationMin: number;
  }): Promise<AvailabilitySlot[]> {
    const barber = await this.barbers.findOne({
      where: { id: input.barberId },
      relations: { schedules: true },
    });
    if (!barber) throw new EntityNotFound('Barber not found');
    if (!barber.active) return [];

    const dayStart = startOfDay(input.date);
    const weekday = dayStart.getDay();
    const slot = barber.schedules.find((s) => s.weekday === weekday);
    if (!slot) return [];

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [appts, blocks] = await Promise.all([
      this.appts
        .createQueryBuilder('a')
        .where('a.barber_id = :id', { id: input.barberId })
        .andWhere("a.status NOT IN ('CANCELLED','NO_SHOW')")
        .andWhere('a.scheduled_at < :end AND a.ends_at > :start', { start: dayStart, end: dayEnd })
        .getMany(),
      this.blocks
        .createQueryBuilder('b')
        .where('b.barber_id = :id', { id: input.barberId })
        .andWhere('b.starts_at < :end AND b.ends_at > :start', { start: dayStart, end: dayEnd })
        .getMany(),
    ]);

    const occupied: Array<[Date, Date]> = [
      ...appts.map((a) => [a.scheduledAt, a.endsAt] as [Date, Date]),
      ...blocks.map((b) => [b.startsAt, b.endsAt] as [Date, Date]),
    ];

    const [sh, sm] = slot.startTime.split(':').map(Number);
    const [eh, em] = slot.endTime.split(':').map(Number);
    const workStart = new Date(dayStart);
    workStart.setHours(sh, sm, 0, 0);
    const workEnd = new Date(dayStart);
    workEnd.setHours(eh, em, 0, 0);

    const slots: AvailabilitySlot[] = [];
    for (
      let cursor = workStart.getTime();
      cursor + input.durationMin * 60_000 <= workEnd.getTime();
      cursor += SLOT_MINUTES * 60_000
    ) {
      const startsAt = new Date(cursor);
      const endsAt = new Date(cursor + input.durationMin * 60_000);
      if (startsAt.getTime() <= Date.now()) continue; // sólo a futuro
      const overlaps = occupied.some(([s, e]) => startsAt < e && endsAt > s);
      if (!overlaps) slots.push({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() });
    }
    return slots;
  }
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
