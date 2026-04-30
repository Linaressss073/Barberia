import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityNotFound } from '@core/exceptions/domain.exception';
import { AppointmentDoc, AppointmentDocument } from '../infrastructure/persistence/appointment.schema';
import { BarberDoc, BarberDocument } from '@modules/barbers/infrastructure/persistence/barber.schema';
import { BarberBlockDoc, BarberBlockDocument } from '@modules/barbers/infrastructure/persistence/barber-block.schema';

export interface AvailabilitySlot {
  startsAt: string;
  endsAt: string;
}

const SLOT_MINUTES = 30;

@Injectable()
export class GetAvailabilityUseCase {
  constructor(
    @InjectModel(AppointmentDoc.name) private readonly appts: Model<AppointmentDocument>,
    @InjectModel(BarberDoc.name) private readonly barbers: Model<BarberDocument>,
    @InjectModel(BarberBlockDoc.name) private readonly blocks: Model<BarberBlockDocument>,
  ) {}

  async execute(input: {
    barberId: string;
    date: Date;
    durationMin: number;
  }): Promise<AvailabilitySlot[]> {
    const barber = await this.barbers.findOne({ _id: input.barberId });
    if (!barber) throw new EntityNotFound('Barber not found');
    if (!barber.active) return [];

    const dayStart = startOfDay(input.date);
    const weekday = dayStart.getDay();
    const slot = barber.schedules.find((s) => s.weekday === weekday);
    if (!slot) return [];

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [apptList, blockList] = await Promise.all([
      this.appts.find({
        barberId: input.barberId,
        status: { $nin: ['CANCELLED', 'NO_SHOW'] },
        scheduledAt: { $lt: dayEnd },
        endsAt: { $gt: dayStart },
      }),
      this.blocks.find({
        barberId: input.barberId,
        startsAt: { $lt: dayEnd },
        endsAt: { $gt: dayStart },
      }),
    ]);

    const occupied: Array<[Date, Date]> = [
      ...apptList.map((a) => [a.scheduledAt, a.endsAt] as [Date, Date]),
      ...blockList.map((b) => [b.startsAt, b.endsAt] as [Date, Date]),
    ];

    const [sh, sm] = slot.startTime.split(':').map(Number);
    const [eh, em_] = slot.endTime.split(':').map(Number);
    const workStart = new Date(dayStart);
    workStart.setHours(sh, sm, 0, 0);
    const workEnd = new Date(dayStart);
    workEnd.setHours(eh, em_, 0, 0);

    const slots: AvailabilitySlot[] = [];
    for (
      let cursor = workStart.getTime();
      cursor + input.durationMin * 60_000 <= workEnd.getTime();
      cursor += SLOT_MINUTES * 60_000
    ) {
      const startsAt = new Date(cursor);
      const endsAt = new Date(cursor + input.durationMin * 60_000);
      if (startsAt.getTime() <= Date.now()) continue;
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
