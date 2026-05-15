import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  BusinessRuleViolation,
  EntityConflict,
  EntityNotFound,
  InvalidArgument,
} from '@core/exceptions/domain.exception';
import { requestContext } from '@core/context/request-context';
import { AppointmentDoc, AppointmentDocument } from '../infrastructure/persistence/appointment.schema';
import { CustomerDoc, CustomerDocument } from '@modules/customers/infrastructure/persistence/customer.schema';
import { BarberDoc, BarberDocument } from '@modules/barbers/infrastructure/persistence/barber.schema';
import { BarberBlockDoc, BarberBlockDocument } from '@modules/barbers/infrastructure/persistence/barber-block.schema';
import { ServiceDoc, ServiceDocument } from '@modules/services/infrastructure/persistence/service.schema';
import { UserDoc, UserDocument } from '@modules/auth/infrastructure/persistence/user.schema';
import { NotificationsService } from '@modules/notifications/application/notifications.service';
import { UpsertCustomerTenantUseCase } from '@modules/customer-tenants/application/use-cases/upsert-customer-tenant.use-case';
import { CUSTOMER_TENANT_REPOSITORY, CustomerTenantRepository } from '@modules/customer-tenants/domain/repositories/customer-tenant.repository';

export interface BookAppointmentInput {
  customerId: string;
  barberId?: string | null;
  scheduledAt: Date;
  serviceIds: string[];
  source?: 'WEB' | 'PHONE' | 'WALKIN' | 'ADMIN';
  notes?: string;
}

// In-memory map to allow clearTimeout on cancellation
export const pendingReminders = new Map<string, NodeJS.Timeout[]>();

@Injectable()
export class BookAppointmentUseCase {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(AppointmentDoc.name) private readonly appts: Model<AppointmentDocument>,
    @InjectModel(CustomerDoc.name) private readonly customers: Model<CustomerDocument>,
    @InjectModel(BarberDoc.name) private readonly barbers: Model<BarberDocument>,
    @InjectModel(BarberBlockDoc.name) private readonly blocks: Model<BarberBlockDocument>,
    @InjectModel(ServiceDoc.name) private readonly services: Model<ServiceDocument>,
    @InjectModel(UserDoc.name) private readonly users: Model<UserDocument>,
    private readonly notifications: NotificationsService,
    private readonly upsertTenantUC: UpsertCustomerTenantUseCase,
    @Inject(CUSTOMER_TENANT_REPOSITORY) private readonly ctRepo: CustomerTenantRepository,
  ) {}

  private tenantQ(): Record<string, unknown> {
    const t = requestContext.get()?.tenantId;
    return t ? { tenantId: t } : {};
  }

  async execute(
    input: BookAppointmentInput,
  ): Promise<{ id: string; endsAt: Date; totalCents: number; barberId: string }> {
    if (input.scheduledAt.getTime() <= Date.now()) {
      throw new InvalidArgument('scheduledAt must be in the future');
    }

    const ctx = requestContext.get();
    const tenantId = ctx?.tenantId ?? null;

    // ── Resolve barber ─────────────────────────────────────────────────────────
    let barberId = input.barberId;
    if (!barberId) {
      barberId = await this.autoAssignBarber(input.scheduledAt, input.serviceIds, tenantId);
    }

    const session = await this.connection.startSession();
    let result: { id: string; endsAt: Date; totalCents: number; barberId: string };
    try {
      result = await session.withTransaction(async () => {
        const customer = await this.customers.findOne(
          { _id: input.customerId, deletedAt: null, ...this.tenantQ() },
          null,
          { session },
        );
        if (!customer) throw new EntityNotFound('Customer not found');

        const barber = await this.barbers.findOne({ _id: barberId, ...this.tenantQ() }, null, { session });
        if (!barber) throw new EntityNotFound('Barber not found');
        if (!barber.active) throw new BusinessRuleViolation('Barber is not active');

        if (input.serviceIds.length === 0) throw new InvalidArgument('At least one service is required');

        const svcs = await this.services.find({
          _id: { $in: input.serviceIds },
          active: true,
          deletedAt: null,
          ...this.tenantQ(),
        }, null, { session });
        if (svcs.length !== input.serviceIds.length) {
          throw new EntityNotFound('One or more services not found or inactive');
        }

        const totalDuration = svcs.reduce((s, sv) => s + sv.durationMin, 0);
        const totalCents = svcs.reduce((s, sv) => s + sv.priceCents, 0);
        const endsAt = new Date(input.scheduledAt.getTime() + totalDuration * 60_000);

        const blockOverlap = await this.blocks.countDocuments({
          barberId,
          startsAt: { $lt: endsAt },
          endsAt: { $gt: input.scheduledAt },
          ...this.tenantQ(),
        }, { session });
        if (blockOverlap > 0) throw new BusinessRuleViolation('Barber has a block on that time');

        const apptOverlap = await this.appts.countDocuments({
          barberId,
          status: { $nin: ['CANCELLED', 'NO_SHOW'] },
          scheduledAt: { $lt: endsAt },
          endsAt: { $gt: input.scheduledAt },
          ...this.tenantQ(),
        }, { session });
        if (apptOverlap > 0) throw new EntityConflict('Time slot is no longer available');

        const appointmentId = uuidv4();
        await this.appts.create([{
          _id: appointmentId,
          customerId: input.customerId,
          barberId,
          scheduledAt: input.scheduledAt,
          endsAt,
          tenantId,
          status: 'BOOKED',
          source: input.source ?? 'WEB',
          notes: input.notes ?? null,
          createdBy: ctx?.userId ?? null,
          items: svcs.map(s => ({
            id: uuidv4(),
            serviceId: s._id,
            priceCents: s.priceCents,
            durationMin: s.durationMin,
          })),
        }], { session });

        return { id: appointmentId, endsAt, totalCents, barberId: barberId as string };
      });
    } finally {
      await session.endSession();
    }

    // ── Post-booking side effects (fire-and-forget) ────────────────────────────
    void this.afterBooking(input, result);
    return result;
  }

  private async autoAssignBarber(scheduledAt: Date, serviceIds: string[], tenantId: string | null): Promise<string> {
    const tenantFilter = tenantId ? { tenantId } : {};
    const activeBarbers = await this.barbers.find({ active: true, ...tenantFilter });
    if (activeBarbers.length === 0) throw new BusinessRuleViolation('No active barbers available');

    const svcs = await this.services.find({ _id: { $in: serviceIds }, ...tenantFilter });
    const totalDuration = svcs.reduce((s, sv) => s + sv.durationMin, 0);
    const endsAt = new Date(scheduledAt.getTime() + totalDuration * 60_000);

    const dayStart = new Date(scheduledAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Pick barber with fewest appointments today who is free at the slot
    let bestBarber: string | null = null;
    let bestCount = Infinity;

    for (const barber of activeBarbers) {
      const weekday = dayStart.getDay();
      const schedule = barber.schedules.find(s => s.weekday === weekday);
      if (!schedule) continue;

      const [sh, sm] = schedule.startTime.split(':').map(Number);
      const [eh, em] = schedule.endTime.split(':').map(Number);
      const workStart = new Date(dayStart);
      workStart.setHours(sh, sm, 0, 0);
      const workEnd = new Date(dayStart);
      workEnd.setHours(eh, em, 0, 0);
      if (scheduledAt < workStart || endsAt > workEnd) continue;

      const [blockOverlap, apptOverlap, dayCount] = await Promise.all([
        this.blocks.countDocuments({ barberId: barber._id, startsAt: { $lt: endsAt }, endsAt: { $gt: scheduledAt }, ...tenantFilter }),
        this.appts.countDocuments({ barberId: barber._id, status: { $nin: ['CANCELLED', 'NO_SHOW'] }, scheduledAt: { $lt: endsAt }, endsAt: { $gt: scheduledAt }, ...tenantFilter }),
        this.appts.countDocuments({ barberId: barber._id, status: { $nin: ['CANCELLED', 'NO_SHOW'] }, scheduledAt: { $gte: dayStart, $lt: dayEnd }, ...tenantFilter }),
      ]);

      if (blockOverlap > 0 || apptOverlap > 0) continue;
      if (dayCount < bestCount) {
        bestCount = dayCount;
        bestBarber = barber._id as string;
      }
    }

    if (!bestBarber) throw new EntityConflict('No barber available for the selected time');
    return bestBarber;
  }

  private async afterBooking(
    input: BookAppointmentInput,
    result: { id: string; endsAt: Date; totalCents: number; barberId: string },
  ): Promise<void> {
    try {
      // Record visit in customer_tenants
      const tenantId = requestContext.get()?.tenantId;
      if (tenantId) {
        const customer = await this.customers.findOne({ _id: input.customerId });
        if (customer?.userId) {
          await this.upsertTenantUC.execute(customer.userId as string, tenantId, true);
        }
      }
    } catch { /* non-blocking */ }

    void this.sendBookingNotification(input, result);
    this.scheduleReminders(result.id, input.scheduledAt);
  }

  private scheduleReminders(appointmentId: string, scheduledAt: Date): void {
    const timers: NodeJS.Timeout[] = [];
    const ms24h = scheduledAt.getTime() - Date.now() - 24 * 3600 * 1000;
    const ms1h = scheduledAt.getTime() - Date.now() - 1 * 3600 * 1000;
    if (ms24h > 0) timers.push(setTimeout(() => void this.sendReminder(appointmentId, '24H'), ms24h));
    if (ms1h > 0) timers.push(setTimeout(() => void this.sendReminder(appointmentId, '1H'), ms1h));
    if (timers.length) pendingReminders.set(appointmentId, timers);
  }

  private async sendReminder(appointmentId: string, type: '24H' | '1H'): Promise<void> {
    try {
      const appt = await this.appts.findOne({ _id: appointmentId });
      if (!appt || ['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(appt.status)) return;

      const customer = await this.customers.findOne({ _id: appt.customerId });
      if (!customer?.userId) return;
      const user = await this.users.findOne({ _id: customer.userId });
      if (!user?.email) return;

      const barber = await this.barbers.findOne({ _id: appt.barberId });
      await this.notifications.send('EMAIL', {
        to: user.email,
        template: 'appointment.reminder',
        payload: {
          customerName: customer.fullName,
          barberName: barber?.displayName ?? '',
          scheduledAt: appt.scheduledAt.toISOString(),
          reminderType: type,
          appointmentId,
        },
      });
    } catch { /* non-blocking */ }
  }

  private async sendBookingNotification(
    input: BookAppointmentInput,
    result: { id: string; endsAt: Date; totalCents: number },
  ): Promise<void> {
    try {
      const customer = await this.customers.findOne({ _id: input.customerId, deletedAt: null, ...this.tenantQ() });
      if (!customer?.userId) return;
      const user = await this.users.findOne({ _id: customer.userId });
      if (!user?.email) return;

      const [barber, svcs] = await Promise.all([
        this.barbers.findOne({ _id: input.barberId ?? result['barberId'], ...this.tenantQ() }),
        this.services.find({ _id: { $in: input.serviceIds }, ...this.tenantQ() }),
      ]);

      await this.notifications.send('EMAIL', {
        to: user.email,
        template: 'appointment.booked',
        payload: {
          customerName: customer.fullName,
          barberName: barber?.displayName ?? '',
          scheduledAt: input.scheduledAt.toISOString(),
          endsAt: result.endsAt.toISOString(),
          services: svcs.map(s => s.name),
          totalCents: result.totalCents,
          appointmentId: result.id,
        },
      });
    } catch { /* non-blocking */ }
  }
}
