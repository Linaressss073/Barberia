import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BusinessRuleViolation, EntityNotFound } from '@core/exceptions/domain.exception';
import { AppointmentOrmEntity } from '../infrastructure/persistence/appointment.orm-entity';

const MIN_CANCEL_LEAD_MS = 2 * 60 * 60 * 1000; // 2h

/**
 * CancelAppointmentUseCase
 * Reglas:
 *  - Sólo BOOKED o CONFIRMED se pueden cancelar.
 *  - Cliente no puede cancelar si faltan menos de 2h (server-time).
 *  - Admin/Receptionist pueden forzar (parámetro `force`).
 */
@Injectable()
export class CancelAppointmentUseCase {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async execute(input: { id: string; reason?: string; force?: boolean }): Promise<void> {
    await this.ds.transaction(async (em) => {
      const appt = await em
        .createQueryBuilder(AppointmentOrmEntity, 'a')
        .setLock('pessimistic_write')
        .where('a.id = :id', { id: input.id })
        .getOne();

      if (!appt) throw new EntityNotFound('Appointment not found');
      if (appt.status === 'CANCELLED' || appt.status === 'COMPLETED' || appt.status === 'NO_SHOW') {
        throw new BusinessRuleViolation(`Cannot cancel appointment in status ${appt.status}`);
      }

      const msUntil = appt.scheduledAt.getTime() - Date.now();
      if (!input.force && msUntil < MIN_CANCEL_LEAD_MS) {
        throw new BusinessRuleViolation('Cancellations require at least 2 hours notice', {
          minutesRemaining: Math.floor(msUntil / 60_000),
        });
      }

      await em.update(
        AppointmentOrmEntity,
        { id: appt.id },
        {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: input.reason ?? null,
        },
      );
    });
  }
}
