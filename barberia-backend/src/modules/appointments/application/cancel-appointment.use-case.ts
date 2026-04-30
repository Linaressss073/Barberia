import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BusinessRuleViolation, EntityNotFound } from '@core/exceptions/domain.exception';
import { AppointmentDoc, AppointmentDocument } from '../infrastructure/persistence/appointment.schema';

const MIN_CANCEL_LEAD_MS = 2 * 60 * 60 * 1000; // 2h

@Injectable()
export class CancelAppointmentUseCase {
  constructor(
    @InjectModel(AppointmentDoc.name) private readonly repo: Model<AppointmentDocument>,
  ) {}

  async execute(input: { id: string; reason?: string; force?: boolean }): Promise<void> {
    const appt = await this.repo.findOne({ _id: input.id });
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
    await this.repo.findOneAndUpdate(
      { _id: input.id },
      { $set: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: input.reason ?? null } },
    );
  }
}
