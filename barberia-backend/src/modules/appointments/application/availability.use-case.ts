import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { requestContext } from '@core/context/request-context';
import { EntityNotFound } from '@core/exceptions/domain.exception';
import { AppointmentDoc, AppointmentDocument } from '../infrastructure/persistence/appointment.schema';
import { BarberDoc, BarberDocument } from '@modules/barbers/infrastructure/persistence/barber.schema';
import { BarberBlockDoc, BarberBlockDocument } from '@modules/barbers/infrastructure/persistence/barber-block.schema';

export interface AvailabilitySlot {
  startsAt: string;
  endsAt: string;
  availableBarberIds?: string[];
}

const SLOT_MINUTES = 30;

@Injectable()
export class GetAvailabilityUseCase {
  constructor(
    @InjectModel(AppointmentDoc.name) private readonly appts: Model<AppointmentDocument>,
    @InjectModel(BarberDoc.name) private readonly barbers: Model<BarberDocument>,
    @InjectModel(BarberBlockDoc.name) private readonly blocks: Model<BarberBlockDocument>,
  ) {}

  private tenantQ(): Record<string, unknown> {
    const t = requestContext.get()?.tenantId;
    return t ? { tenantId: t } : {};
  }

  async execute(input: {
    barberId: string | 'any';
    date: Date;
    durationMin: number;
  }): Promise<AvailabilitySlot[]> {
    if (input.barberId === 'any') {
      return this.executeAnyBarber(input.date, input.durationMin);
    }
    return this.executeSpecific(input.barberId, input.date, input.durationMin);
  }

  private async executeSpecific(barberId: string, date: Date, durationMin: number): Promise<AvailabilitySlot[]> {
    const barber = await this.barbers.findOne({ _id: barberId, ...this.tenantQ() });
    if (!barber) throw new EntityNotFound('Barber not found');
    if (!barber.active) return [];

    const slots = await this.slotsForBarber(barber, date, durationMin);
    return slots.map(s => ({ startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString() }));
  }

  private async executeAnyBarber(date: Date, durationMin: number): Promise<AvailabilitySlot[]> {
    const allBarbers = await this.barbers.find({ active: true, ...this.tenantQ() });
    if (allBarbers.length === 0) return [];

    // Compute slots per barber, then merge: a slot is available if ≥1 barber is free
    const slotMap = new Map<string, { startsAt: Date; endsAt: Date; barberIds: string[] }>();

    await Promise.all(allBarbers.map(async barber => {
      const barberSlots = await this.slotsForBarber(barber, date, durationMin);
      for (const s of barberSlots) {
        const key = s.startsAt.toISOString();
        const existing = slotMap.get(key);
        if (existing) {
          existing.barberIds.push(barber._id as string);
        } else {
          slotMap.set(key, { startsAt: s.startsAt, endsAt: s.endsAt, barberIds: [barber._id as string] });
        }
      }
    }));

    return Array.from(slotMap.values())
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .map(s => ({
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        availableBarberIds: s.barberIds,
      }));
  }

  private async slotsForBarber(
    barber: BarberDocument,
    date: Date,
    durationMin: number,
  ): Promise<Array<{ startsAt: Date; endsAt: Date }>> {
    const dayStart = startOfDay(date);
    const weekday = dayStart.getDay();
    const schedule = barber.schedules.find(s => s.weekday === weekday);
    if (!schedule) return [];

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [apptList, blockList] = await Promise.all([
      this.appts.find({
        barberId: barber._id,
        status: { $nin: ['CANCELLED', 'NO_SHOW'] },
        scheduledAt: { $lt: dayEnd },
        endsAt: { $gt: dayStart },
        ...this.tenantQ(),
      }),
      this.blocks.find({
        barberId: barber._id,
        startsAt: { $lt: dayEnd },
        endsAt: { $gt: dayStart },
        ...this.tenantQ(),
      }),
    ]);

    const occupied: Array<[Date, Date]> = [
      ...apptList.map(a => [a.scheduledAt, a.endsAt] as [Date, Date]),
      ...blockList.map(b => [b.startsAt, b.endsAt] as [Date, Date]),
    ];

    const [sh, sm] = schedule.startTime.split(':').map(Number);
    const [eh, em] = schedule.endTime.split(':').map(Number);
    const workStart = new Date(dayStart);
    workStart.setHours(sh, sm, 0, 0);
    const workEnd = new Date(dayStart);
    workEnd.setHours(eh, em, 0, 0);

    const slots: Array<{ startsAt: Date; endsAt: Date }> = [];
    for (
      let cursor = workStart.getTime();
      cursor + durationMin * 60_000 <= workEnd.getTime();
      cursor += SLOT_MINUTES * 60_000
    ) {
      const startsAt = new Date(cursor);
      const endsAt = new Date(cursor + durationMin * 60_000);
      if (startsAt.getTime() <= Date.now()) continue;
      const overlaps = occupied.some(([s, e]) => startsAt < e && endsAt > s);
      if (!overlaps) slots.push({ startsAt, endsAt });
    }
    return slots;
  }
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
