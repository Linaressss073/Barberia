import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  BusinessRuleViolation,
  EntityConflict,
  EntityNotFound,
  InvalidArgument,
} from '@core/exceptions/domain.exception';
import { requestContext } from '@core/context/request-context';
import { AppointmentOrmEntity } from '../infrastructure/persistence/appointment.orm-entity';
import { AppointmentItemOrmEntity } from '../infrastructure/persistence/appointment-item.orm-entity';
import { CustomerOrmEntity } from '@modules/customers/infrastructure/persistence/customer.orm-entity';
import { BarberOrmEntity } from '@modules/barbers/infrastructure/persistence/barber.orm-entity';
import { ServiceOrmEntity } from '@modules/services/infrastructure/persistence/service.orm-entity';
import { BarberBlockOrmEntity } from '@modules/barbers/infrastructure/persistence/barber-block.orm-entity';

export interface BookAppointmentInput {
  customerId: string;
  barberId: string;
  scheduledAt: Date;
  serviceIds: string[];
  source?: 'WEB' | 'PHONE' | 'WALKIN' | 'ADMIN';
  notes?: string;
}

/**
 * BookAppointmentUseCase
 * Validaciones:
 *  - Customer y Barber existen y barber está activo.
 *  - Servicios existen y activos.
 *  - scheduledAt > now (servidor).
 *  - Suma de duración determina endsAt.
 *  - Sin solape con bloqueos del barbero.
 *  - Sin doble booking (garantizado por EXCLUDE USING gist a nivel BD).
 */
@Injectable()
export class BookAppointmentUseCase {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async execute(
    input: BookAppointmentInput,
  ): Promise<{ id: string; endsAt: Date; totalCents: number }> {
    if (input.scheduledAt.getTime() <= Date.now()) {
      throw new InvalidArgument('scheduledAt must be in the future');
    }

    return this.ds.transaction('REPEATABLE READ', async (em) => {
      const customer = await em.findOne(CustomerOrmEntity, { where: { id: input.customerId } });
      if (!customer) throw new EntityNotFound('Customer not found');

      const barber = await em.findOne(BarberOrmEntity, { where: { id: input.barberId } });
      if (!barber) throw new EntityNotFound('Barber not found');
      if (!barber.active) throw new BusinessRuleViolation('Barber is not active');

      if (input.serviceIds.length === 0)
        throw new InvalidArgument('At least one service is required');
      const services = await em
        .createQueryBuilder(ServiceOrmEntity, 's')
        .where('s.id IN (:...ids) AND s.active = true AND s.deleted_at IS NULL', {
          ids: input.serviceIds,
        })
        .getMany();
      if (services.length !== input.serviceIds.length) {
        throw new EntityNotFound('One or more services not found or inactive');
      }

      const totalDuration = services.reduce((sum, s) => sum + s.durationMin, 0);
      const totalPrice = services.reduce((sum, s) => sum + s.priceCents, 0);
      const endsAt = new Date(input.scheduledAt.getTime() + totalDuration * 60_000);

      // Verificar solape con bloqueos del barbero (los bloqueos no entran al EXCLUDE de appointments)
      const blockOverlap = await em
        .createQueryBuilder(BarberBlockOrmEntity, 'b')
        .where('b.barber_id = :id', { id: input.barberId })
        .andWhere(`tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(:s, :e, '[)')`, {
          s: input.scheduledAt,
          e: endsAt,
        })
        .getCount();
      if (blockOverlap > 0) throw new BusinessRuleViolation('Barber has a block on that time');

      const ctx = requestContext.get();
      const insertResult = await em
        .createQueryBuilder()
        .insert()
        .into(AppointmentOrmEntity)
        .values({
          customerId: input.customerId,
          barberId: input.barberId,
          scheduledAt: input.scheduledAt,
          endsAt,
          status: 'BOOKED',
          source: input.source ?? 'WEB',
          notes: input.notes ?? null,
          createdBy: ctx?.userId ?? null,
        })
        .execute()
        .catch((err: unknown) => {
          if (
            err instanceof QueryFailedError &&
            err.message.includes('ex_appointments_no_overlap')
          ) {
            throw new EntityConflict('Time slot is no longer available');
          }
          throw err;
        });

      const appointmentId = insertResult.identifiers[0]?.id as string;
      await em.insert(
        AppointmentItemOrmEntity,
        services.map((s) => ({
          appointmentId,
          serviceId: s.id,
          priceCents: s.priceCents,
          durationMin: s.durationMin,
        })),
      );

      return { id: appointmentId, endsAt, totalCents: totalPrice };
    });
  }
}
