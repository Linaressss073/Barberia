import { Injectable } from '@nestjs/common';
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

export interface BookAppointmentInput {
  customerId: string;
  barberId: string;
  scheduledAt: Date;
  serviceIds: string[];
  source?: 'WEB' | 'PHONE' | 'WALKIN' | 'ADMIN';
  notes?: string;
}

@Injectable()
export class BookAppointmentUseCase {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(AppointmentDoc.name) private readonly appts: Model<AppointmentDocument>,
    @InjectModel(CustomerDoc.name) private readonly customers: Model<CustomerDocument>,
    @InjectModel(BarberDoc.name) private readonly barbers: Model<BarberDocument>,
    @InjectModel(BarberBlockDoc.name) private readonly blocks: Model<BarberBlockDocument>,
    @InjectModel(ServiceDoc.name) private readonly services: Model<ServiceDocument>,
  ) {}

  async execute(
    input: BookAppointmentInput,
  ): Promise<{ id: string; endsAt: Date; totalCents: number }> {
    if (input.scheduledAt.getTime() <= Date.now()) {
      throw new InvalidArgument('scheduledAt must be in the future');
    }

    const session = await this.connection.startSession();
    try {
      return await session.withTransaction(async () => {
        const customer = await this.customers.findOne({ _id: input.customerId, deletedAt: null }, null, { session });
        if (!customer) throw new EntityNotFound('Customer not found');

        const barber = await this.barbers.findOne({ _id: input.barberId }, null, { session });
        if (!barber) throw new EntityNotFound('Barber not found');
        if (!barber.active) throw new BusinessRuleViolation('Barber is not active');

        if (input.serviceIds.length === 0) throw new InvalidArgument('At least one service is required');

        const svcs = await this.services.find({
          _id: { $in: input.serviceIds },
          active: true,
          deletedAt: null,
        }, null, { session });
        if (svcs.length !== input.serviceIds.length) {
          throw new EntityNotFound('One or more services not found or inactive');
        }

        const totalDuration = svcs.reduce((s, sv) => s + sv.durationMin, 0);
        const totalCents = svcs.reduce((s, sv) => s + sv.priceCents, 0);
        const endsAt = new Date(input.scheduledAt.getTime() + totalDuration * 60_000);

        // Check block overlap
        const blockOverlap = await this.blocks.countDocuments({
          barberId: input.barberId,
          startsAt: { $lt: endsAt },
          endsAt: { $gt: input.scheduledAt },
        }, { session });
        if (blockOverlap > 0) throw new BusinessRuleViolation('Barber has a block on that time');

        // Check appointment overlap
        const apptOverlap = await this.appts.countDocuments({
          barberId: input.barberId,
          status: { $nin: ['CANCELLED', 'NO_SHOW'] },
          scheduledAt: { $lt: endsAt },
          endsAt: { $gt: input.scheduledAt },
        }, { session });
        if (apptOverlap > 0) throw new EntityConflict('Time slot is no longer available');

        const ctx = requestContext.get();
        const appointmentId = uuidv4();
        await this.appts.create([{
          _id: appointmentId,
          customerId: input.customerId,
          barberId: input.barberId,
          scheduledAt: input.scheduledAt,
          endsAt,
          status: 'BOOKED',
          source: input.source ?? 'WEB',
          notes: input.notes ?? null,
          createdBy: ctx?.userId ?? null,
          items: svcs.map((s) => ({
            id: uuidv4(),
            serviceId: s._id,
            priceCents: s.priceCents,
            durationMin: s.durationMin,
          })),
        }], { session });

        return { id: appointmentId, endsAt, totalCents };
      });
    } finally {
      await session.endSession();
    }
  }
}
