import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BusinessRuleViolation, EntityNotFound } from '@core/exceptions/domain.exception';
import { requestContext } from '@core/context/request-context';
import {
  AppointmentDoc,
  AppointmentDocument,
  AppointmentStatus,
} from '../infrastructure/persistence/appointment.schema';
import { CustomerDoc, CustomerDocument } from '@modules/customers/infrastructure/persistence/customer.schema';
import { UserDoc, UserDocument } from '@modules/auth/infrastructure/persistence/user.schema';
import { NotificationsService } from '@modules/notifications/application/notifications.service';

const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  BOOKED: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const NOTIFICATION_TEMPLATES: Partial<Record<AppointmentStatus, string>> = {
  CONFIRMED: 'appointment.confirmed',
  CANCELLED: 'appointment.cancelled',
  COMPLETED: 'appointment.completed',
};

@Injectable()
export class TransitionAppointmentUseCase {
  constructor(
    @InjectModel(AppointmentDoc.name) private readonly repo: Model<AppointmentDocument>,
    @InjectModel(CustomerDoc.name) private readonly customers: Model<CustomerDocument>,
    @InjectModel(UserDoc.name) private readonly users: Model<UserDocument>,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(id: string, next: AppointmentStatus): Promise<AppointmentDocument> {
    const tenantId = requestContext.get()?.tenantId;
    const tenantFilter = tenantId ? { tenantId } : {};
    const appt = await this.repo.findOne({ _id: id, ...tenantFilter });
    if (!appt) throw new EntityNotFound('Appointment not found');
    if (!TRANSITIONS[appt.status].includes(next)) {
      throw new BusinessRuleViolation(`Invalid transition ${appt.status} → ${next}`);
    }
    const updated = await this.repo.findOneAndUpdate(
      { _id: id },
      { $set: { status: next } },
      { new: true },
    );

    void this.sendTransitionNotification(updated!, next);
    return updated!;
  }

  private async sendTransitionNotification(
    appt: AppointmentDocument,
    next: AppointmentStatus,
  ): Promise<void> {
    const template = NOTIFICATION_TEMPLATES[next];
    if (!template) return;

    try {
      const customer = await this.customers.findOne({ _id: appt.customerId, deletedAt: null });
      if (!customer?.userId) return;
      const user = await this.users.findOne({ _id: customer.userId, deletedAt: null });
      if (!user?.email) return;

      await this.notifications.send('EMAIL', {
        to: user.email,
        template,
        payload: {
          customerName: customer.fullName,
          scheduledAt: appt.scheduledAt.toISOString(),
          status: next,
          appointmentId: appt._id,
        },
      });
    } catch {
      // Notifications are best-effort
    }
  }
}
