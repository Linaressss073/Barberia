import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Barber } from '../../domain/entities/barber.entity';
import { BarberOrmEntity } from './barber.orm-entity';
import { BarberScheduleOrmEntity } from './barber-schedule.orm-entity';

export class BarberMapper {
  static toDomain(orm: BarberOrmEntity): Barber {
    return Barber.rehydrate(
      {
        userId: new UniqueEntityId(orm.userId),
        displayName: orm.displayName,
        specialty: orm.specialty ?? undefined,
        hireDate: orm.hireDate,
        commissionPct: parseFloat(orm.commissionPct),
        active: orm.active,
        ratingAvg: parseFloat(orm.ratingAvg),
        schedules: (orm.schedules ?? []).map((s) => ({
          weekday: s.weekday,
          startTime: s.startTime.slice(0, 5),
          endTime: s.endTime.slice(0, 5),
        })),
        createdAt: orm.createdAt,
        updatedAt: orm.updatedAt,
      },
      new UniqueEntityId(orm.id),
    );
  }

  static toOrm(domain: Barber): BarberOrmEntity {
    const orm = new BarberOrmEntity();
    orm.id = domain.id.value;
    orm.userId = domain.userId.value;
    orm.displayName = domain.displayName;
    orm.specialty = domain.specialty ?? null;
    orm.hireDate = domain.hireDate;
    orm.commissionPct = domain.commissionPct.toFixed(2);
    orm.active = domain.active;
    orm.ratingAvg = domain.ratingAvg.toFixed(2);
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.schedules = domain.schedules.map((s) => {
      const slot = new BarberScheduleOrmEntity();
      slot.barberId = domain.id.value;
      slot.weekday = s.weekday;
      slot.startTime = s.startTime;
      slot.endTime = s.endTime;
      return slot;
    });
    return orm;
  }
}
