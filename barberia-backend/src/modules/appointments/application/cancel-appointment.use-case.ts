import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BusinessRuleViolation, EntityNotFound } from '@core/exceptions/domain.exception';
import { AppointmentDoc, AppointmentDocument } from '../infrastructure/persistence/appointment.schema';
import { CustomerDoc, CustomerDocument } from '@modules/customers/infrastructure/persistence/customer.schema';
import { UserDoc, UserDocument } from '@modules/auth/infrastructure/persistence/user.schema';
import { NotificationsService } from '@modules/notifications/application/notifications.service';

const MIN_CANCEL_LEAD_MS = 2 * 60 * 60 * 1000; // 2h

@Injectable()
export class CancelAppointmentUseCase {
  constructor(
    @InjectModel(AppointmentDoc.name) private readonly repo: Model<AppointmentDocument>,
    @InjectModel(CustomerDoc.name) private readonly customers: Model<CustomerDocument>,
    @InjectModel(UserDoc.name) private readonly users: Model<UserDocument>,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(input: { id: string; reason?: string; force?: boolean }): Promise<void> {
    const appt = await this.repo.findOne({ _id: input.id });
    if (!appt) throw new EntityNotFound('Appointment not found');
    if (appt.status === 'CANCELLED' || appt.status === 'COMPLETED' || appt.status === 'NO_SHOW') {
      throw new BusinessRuleViolation(`Cannot cancel appointment in status ${appt.status}`);
    }
    const msUntil = appt.scheduledAt.getTime() - Date.now();
    if (!input.force && appt.status === 'CONFIRMED' && msUntil < MIN_CANCEL_LEAD_MS) {
      throw new BusinessRuleViolation('Cancellations require at least 2 hours notice', {
        minutesRemaining: Math.floor(msUntil / 60_000),
      });
    }
    await this.repo.findOneAndUpdate(
      { _id: input.id },
      { $set: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: input.reason ?? null } },
    );

    void this.sendCancellationNotification(appt, input.reason);
  }

  private async sendCancellationNotification(
    appt: AppointmentDocument,
    reason?: string,
  ): Promise<void> {
    try {
      const customer = await this.customers.findOne({ _id: appt.customerId, deletedAt: null });
      if (!customer?.userId) return;
      const user = await this.users.findOne({ _id: customer.userId, deletedAt: null });
      if (!user?.email) return;

      await this.notifications.send('EMAIL', {
        to: user.email,
        template: 'appointment.cancelled',
        payload: {
          customerName: customer.fullName,
          scheduledAt: appt.scheduledAt.toISOString(),
          reason: reason ?? null,
          appointmentId: appt._id,
        },
      });
    } catch {
      // Notifications are best-effort
    }
  }
}
