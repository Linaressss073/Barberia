import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Barber } from '../../domain/entities/barber.entity';
import { BarberDocument } from './barber.schema';

export class BarberMapper {
  static toDomain(doc: BarberDocument): Barber {
    return Barber.rehydrate(
      {
        userId: new UniqueEntityId(doc.userId),
        displayName: doc.displayName,
        specialty: doc.specialty ?? undefined,
        hireDate: doc.hireDate,
        commissionPct: parseFloat(doc.commissionPct),
        active: doc.active,
        ratingAvg: parseFloat(doc.ratingAvg),
        schedules: (doc.schedules ?? []).map((s) => ({
          weekday: s.weekday,
          startTime: s.startTime.slice(0, 5),
          endTime: s.endTime.slice(0, 5),
        })),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      new UniqueEntityId(doc._id),
    );
  }

  static toDoc(domain: Barber): Record<string, unknown> {
    return {
      _id: domain.id.value,
      userId: domain.userId.value,
      displayName: domain.displayName,
      specialty: domain.specialty ?? null,
      hireDate: domain.hireDate,
      commissionPct: domain.commissionPct.toFixed(2),
      active: domain.active,
      ratingAvg: domain.ratingAvg.toFixed(2),
      schedules: domain.schedules.map((s) => ({
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    };
  }
}
