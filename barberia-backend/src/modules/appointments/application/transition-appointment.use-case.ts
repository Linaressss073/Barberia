import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BusinessRuleViolation, EntityNotFound } from '@core/exceptions/domain.exception';
import {
  AppointmentDoc,
  AppointmentDocument,
  AppointmentStatus,
} from '../infrastructure/persistence/appointment.schema';

const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  BOOKED: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

@Injectable()
export class TransitionAppointmentUseCase {
  constructor(@InjectModel(AppointmentDoc.name) private readonly repo: Model<AppointmentDocument>) {}

  async execute(id: string, next: AppointmentStatus): Promise<AppointmentDocument> {
    const appt = await this.repo.findOne({ _id: id });
    if (!appt) throw new EntityNotFound('Appointment not found');
    if (!TRANSITIONS[appt.status].includes(next)) {
      throw new BusinessRuleViolation(`Invalid transition ${appt.status} → ${next}`);
    }
    const updated = await this.repo.findOneAndUpdate(
      { _id: id },
      { $set: { status: next } },
      { new: true },
    );
    return updated!;
  }
}
