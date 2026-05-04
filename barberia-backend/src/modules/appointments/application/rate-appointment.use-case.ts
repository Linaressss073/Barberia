import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BusinessRuleViolation,
  EntityNotFound,
  InvalidArgument,
} from '@core/exceptions/domain.exception';
import { requestContext } from '@core/context/request-context';
import { AppointmentDoc, AppointmentDocument } from '../infrastructure/persistence/appointment.schema';
import { CustomerDoc, CustomerDocument } from '@modules/customers/infrastructure/persistence/customer.schema';
import { BarberDoc, BarberDocument } from '@modules/barbers/infrastructure/persistence/barber.schema';

@Injectable()
export class RateAppointmentUseCase {
  constructor(
    @InjectModel(AppointmentDoc.name) private readonly appts: Model<AppointmentDocument>,
    @InjectModel(CustomerDoc.name) private readonly customers: Model<CustomerDocument>,
    @InjectModel(BarberDoc.name) private readonly barbers: Model<BarberDocument>,
  ) {}

  private tenantQ(): Record<string, unknown> {
    const t = requestContext.get()?.tenantId;
    return t ? { tenantId: t } : {};
  }

  async execute(input: { appointmentId: string; userId: string; rating: number }): Promise<{ ok: true }> {
    const r = Math.round(input.rating);
    if (r < 1 || r > 5) throw new InvalidArgument('rating must be between 1 and 5');

    const customer = await this.customers.findOne({
      userId: input.userId,
      deletedAt: null,
      ...this.tenantQ(),
    });
    if (!customer) throw new EntityNotFound('Customer profile not found');

    const appt = await this.appts.findOne({
      _id: input.appointmentId,
      customerId: customer._id,
      ...this.tenantQ(),
    });
    if (!appt) throw new EntityNotFound('Appointment not found');

    if (appt.status !== 'COMPLETED') {
      throw new BusinessRuleViolation('Solo puedes calificar citas completadas');
    }
    if (appt.rating != null) {
      throw new BusinessRuleViolation('Esta cita ya fue calificada');
    }

    await this.appts.updateOne(
      { _id: appt._id },
      { $set: { rating: r, updatedAt: new Date() } },
    );

    const rated = await this.appts.find({
      barberId: appt.barberId,
      rating: { $ne: null },
      ...this.tenantQ(),
    });

    const nums = rated.map((x) => x.rating!).filter((n) => typeof n === 'number');
    const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;

    await this.barbers.updateOne(
      { _id: appt.barberId, ...this.tenantQ() },
      { $set: { ratingAvg: avg.toFixed(2), updatedAt: new Date() } },
    );

    return { ok: true };
  }
}
