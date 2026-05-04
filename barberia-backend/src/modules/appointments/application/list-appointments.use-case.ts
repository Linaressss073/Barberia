import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppointmentDoc, AppointmentDocument } from '../infrastructure/persistence/appointment.schema';
import { CustomerDoc, CustomerDocument } from '@modules/customers/infrastructure/persistence/customer.schema';
import { BarberDoc, BarberDocument } from '@modules/barbers/infrastructure/persistence/barber.schema';
import { Page, buildPage } from '@shared/pagination/pagination.dto';

export interface ListAppointmentsInput {
  page: number;
  limit: number;
  barberId?: string;
  customerId?: string;
  status?: string;
  from?: Date;
  to?: Date;
}

type EnrichedAppointment = AppointmentDocument & {
  customer?: { fullName: string } | null;
  barber?: { displayName: string } | null;
};

@Injectable()
export class ListAppointmentsUseCase {
  constructor(
    @InjectModel(AppointmentDoc.name) private readonly repo: Model<AppointmentDocument>,
    @InjectModel(CustomerDoc.name) private readonly customers: Model<CustomerDocument>,
    @InjectModel(BarberDoc.name) private readonly barbers: Model<BarberDocument>,
  ) {}

  async execute(input: ListAppointmentsInput): Promise<Page<EnrichedAppointment>> {
    const query: Record<string, unknown> = {};
    if (input.barberId) query['barberId'] = input.barberId;
    if (input.customerId) query['customerId'] = input.customerId;
    if (input.status) query['status'] = input.status;
    if (input.from || input.to) {
      query['scheduledAt'] = {
        ...(input.from ? { $gte: input.from } : {}),
        ...(input.to ? { $lt: input.to } : {}),
      };
    }
    const skip = (input.page - 1) * input.limit;
    const [items, total] = await Promise.all([
      this.repo.find(query).sort({ scheduledAt: 1 }).skip(skip).limit(input.limit),
      this.repo.countDocuments(query),
    ]);

    const customerIds = [...new Set(items.map(a => a.customerId).filter(Boolean))];
    const barberIds = [...new Set(items.map(a => a.barberId).filter(Boolean))];

    const [customerDocs, barberDocs] = await Promise.all([
      this.customers.find({ _id: { $in: customerIds } }, { _id: 1, fullName: 1 }),
      this.barbers.find({ _id: { $in: barberIds } }, { _id: 1, displayName: 1 }),
    ]);

    const customerMap = Object.fromEntries(customerDocs.map(c => [c._id, c.fullName]));
    const barberMap = Object.fromEntries(barberDocs.map(b => [b._id, b.displayName]));

    const enriched = items.map(a => {
      const obj = a.toObject() as EnrichedAppointment;
      obj.customer = customerMap[a.customerId] ? { fullName: customerMap[a.customerId] } : null;
      obj.barber = barberMap[a.barberId] ? { displayName: barberMap[a.barberId] } : null;
      return obj;
    });

    return buildPage(enriched, total, input.page, input.limit);
  }
}
