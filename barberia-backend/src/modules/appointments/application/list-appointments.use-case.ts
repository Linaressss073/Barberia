import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppointmentDoc, AppointmentDocument } from '../infrastructure/persistence/appointment.schema';
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

@Injectable()
export class ListAppointmentsUseCase {
  constructor(@InjectModel(AppointmentDoc.name) private readonly repo: Model<AppointmentDocument>) {}

  async execute(input: ListAppointmentsInput): Promise<Page<AppointmentDocument>> {
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
      this.repo.find(query).sort({ scheduledAt: -1 }).skip(skip).limit(input.limit),
      this.repo.countDocuments(query),
    ]);
    return buildPage(items, total, input.page, input.limit);
  }
}
