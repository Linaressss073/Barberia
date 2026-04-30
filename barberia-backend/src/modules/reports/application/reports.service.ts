import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SaleDoc, SaleDocument } from '@modules/sales/infrastructure/persistence/sale.schema';
import { AppointmentDoc, AppointmentDocument } from '@modules/appointments/infrastructure/persistence/appointment.schema';
import { CustomerDoc, CustomerDocument } from '@modules/customers/infrastructure/persistence/customer.schema';
import { BarberDoc, BarberDocument } from '@modules/barbers/infrastructure/persistence/barber.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(SaleDoc.name) private readonly sales: Model<SaleDocument>,
    @InjectModel(AppointmentDoc.name) private readonly appts: Model<AppointmentDocument>,
    @InjectModel(CustomerDoc.name) private readonly customers: Model<CustomerDocument>,
    @InjectModel(BarberDoc.name) private readonly barbers: Model<BarberDocument>,
  ) {}

  async dailySales(
    from: Date,
    to: Date,
  ): Promise<Array<{ day: string; sales: number; total_cents: number }>> {
    const result = await this.sales.aggregate([
      { $match: { status: 'CLOSED', closedAt: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$closedAt' },
          },
          sales: { $sum: 1 },
          total_cents: { $sum: '$totalCents' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, day: '$_id', sales: 1, total_cents: 1 } },
    ]);
    return result;
  }

  async topServices(from: Date, to: Date, limit = 10) {
    return this.sales.aggregate([
      { $match: { status: 'CLOSED', closedAt: { $gte: from, $lt: to } } },
      { $unwind: '$items' },
      { $match: { 'items.kind': 'SERVICE' } },
      {
        $group: {
          _id: '$items.serviceId',
          units: { $sum: '$items.qty' },
          revenue_cents: { $sum: '$items.totalCents' },
        },
      },
      { $sort: { units: -1 } },
      { $limit: limit },
      { $project: { _id: 0, serviceId: '$_id', units: 1, revenue_cents: 1 } },
    ]);
  }

  async occupancyByBarber(from: Date, to: Date) {
    const rangeMinutes =
      Math.floor((to.getTime() - from.getTime()) / 60_000);

    const apptAgg = await this.appts.aggregate([
      {
        $match: {
          status: { $nin: ['CANCELLED', 'NO_SHOW'] },
          scheduledAt: { $gte: from, $lt: to },
        },
      },
      {
        $group: {
          _id: '$barberId',
          booked_minutes: {
            $sum: {
              $divide: [{ $subtract: ['$endsAt', '$scheduledAt'] }, 60000],
            },
          },
        },
      },
    ]);

    const bookedMap = new Map<string, number>(
      apptAgg.map((r: { _id: string; booked_minutes: number }) => [r._id, r.booked_minutes]),
    );

    const allBarbers = await this.barbers.find();
    return allBarbers.map((b) => ({
      barber_id: b._id,
      display_name: b.displayName,
      booked_minutes: Math.round(bookedMap.get(b._id) ?? 0),
      range_minutes: rangeMinutes,
    }));
  }

  async commissionsByBarber(from: Date, to: Date) {
    return this.sales.aggregate([
      { $match: { status: 'CLOSED', closedAt: { $gte: from, $lt: to }, barberId: { $ne: null } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$barberId',
          service_base: {
            $sum: {
              $cond: [{ $eq: ['$items.kind', 'SERVICE'] }, '$items.totalCents', 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'barbers',
          localField: '_id',
          foreignField: '_id',
          as: 'barber',
        },
      },
      { $unwind: '$barber' },
      {
        $project: {
          barber_id: '$_id',
          display_name: '$barber.displayName',
          commission_pct: { $toDouble: '$barber.commissionPct' },
          base_cents: '$service_base',
          commission_cents: {
            $floor: {
              $multiply: [
                '$service_base',
                { $divide: [{ $toDouble: '$barber.commissionPct' }, 100] },
              ],
            },
          },
        },
      },
      { $sort: { commission_cents: -1 } },
    ]);
  }

  async topCustomers(from: Date, to: Date, limit = 10) {
    return this.sales.aggregate([
      {
        $match: {
          status: 'CLOSED',
          closedAt: { $gte: from, $lt: to },
          customerId: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$customerId',
          spent_cents: { $sum: '$totalCents' },
          visits: { $sum: 1 },
        },
      },
      { $sort: { spent_cents: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
      {
        $project: {
          _id: 0,
          id: '$_id',
          full_name: '$customer.fullName',
          visits: 1,
          spent_cents: 1,
        },
      },
    ]);
  }
}
