import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessRuleViolation, EntityNotFound } from '@core/exceptions/domain.exception';
import {
  AppointmentOrmEntity,
  AppointmentStatus,
} from '../infrastructure/persistence/appointment.orm-entity';

const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  BOOKED: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

@Injectable()
export class TransitionAppointmentUseCase {
  constructor(
    @InjectRepository(AppointmentOrmEntity)
    private readonly repo: Repository<AppointmentOrmEntity>,
  ) {}

  async execute(id: string, next: AppointmentStatus): Promise<AppointmentOrmEntity> {
    const appt = await this.repo.findOne({ where: { id } });
    if (!appt) throw new EntityNotFound('Appointment not found');
    if (!TRANSITIONS[appt.status].includes(next)) {
      throw new BusinessRuleViolation(`Invalid transition ${appt.status} → ${next}`);
    }
    appt.status = next;
    return this.repo.save(appt);
  }
}
