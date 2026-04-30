import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  BusinessRuleViolation,
  EntityConflict,
  EntityNotFound,
  InvalidArgument,
} from '@core/exceptions/domain.exception';
import { requestContext } from '@core/context/request-context';
import { SaleDoc, SaleDocument } from '../infrastructure/persistence/sale.schema';
import { ServiceDoc, ServiceDocument } from '@modules/services/infrastructure/persistence/service.schema';
import { InventoryProductDoc, InventoryProductDocument } from '@modules/inventory/infrastructure/persistence/inventory-product.schema';
import { InventoryDomainService } from '@modules/inventory/domain/inventory.service';
import { CustomerDoc, CustomerDocument } from '@modules/customers/infrastructure/persistence/customer.schema';
import { MembershipDoc, MembershipDocument } from '@modules/memberships/infrastructure/persistence/membership.schema';
import { BarberDoc, BarberDocument } from '@modules/barbers/infrastructure/persistence/barber.schema';
import { AppointmentDoc, AppointmentDocument } from '@modules/appointments/infrastructure/persistence/appointment.schema';

export interface OpenSaleInput {
  customerId?: string;
  barberId?: string;
  appointmentId?: string;
}

export interface AddItemInput {
  kind: 'SERVICE' | 'PRODUCT';
  serviceId?: string;
  productId?: string;
  qty: number;
}

export interface AddPaymentInput {
  method: string;
  amountCents: number;
  reference?: string;
}

@Injectable()
export class SalesUseCases {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(SaleDoc.name) private readonly sales: Model<SaleDocument>,
    @InjectModel(ServiceDoc.name) private readonly services: Model<ServiceDocument>,
    @InjectModel(InventoryProductDoc.name) private readonly products: Model<InventoryProductDocument>,
    @InjectModel(CustomerDoc.name) private readonly customers: Model<CustomerDocument>,
    @InjectModel(MembershipDoc.name) private readonly memberships: Model<MembershipDocument>,
    @InjectModel(BarberDoc.name) private readonly barbers: Model<BarberDocument>,
    @InjectModel(AppointmentDoc.name) private readonly appts: Model<AppointmentDocument>,
    private readonly inventory: InventoryDomainService,
  ) {}

  async open(input: OpenSaleInput): Promise<SaleDocument> {
    if (input.appointmentId) {
      const exists = await this.sales.findOne({ appointmentId: input.appointmentId });
      if (exists) throw new EntityConflict('Sale already exists for this appointment');
    }
    const ctx = requestContext.get();
    return this.sales.create({
      _id: uuidv4(),
      customerId: input.customerId ?? null,
      barberId: input.barberId ?? null,
      appointmentId: input.appointmentId ?? null,
      status: 'OPEN',
      createdBy: ctx?.userId ?? null,
      items: [],
      payments: [],
    });
  }

  async addItem(saleId: string, input: AddItemInput): Promise<SaleDocument> {
    if (input.qty <= 0) throw new InvalidArgument('qty must be > 0');

    const sale = await this.sales.findOne({ _id: saleId, status: 'OPEN' });
    if (!sale) throw new BusinessRuleViolation('Sale not found or not OPEN');

    let unitPrice = 0;
    if (input.kind === 'SERVICE') {
      if (!input.serviceId) throw new InvalidArgument('serviceId is required');
      const svc = await this.services.findOne({ _id: input.serviceId });
      if (!svc) throw new EntityNotFound('Service not found');
      unitPrice = svc.priceCents;
    } else if (input.kind === 'PRODUCT') {
      if (!input.productId) throw new InvalidArgument('productId is required');
      const prod = await this.products.findOne({ _id: input.productId });
      if (!prod) throw new EntityNotFound('Product not found');
      unitPrice = prod.salePriceCents;
    } else {
      throw new InvalidArgument('Invalid item kind');
    }

    const totalCents = unitPrice * input.qty;
    const newItem = {
      id: uuidv4(),
      kind: input.kind,
      serviceId: input.serviceId ?? null,
      productId: input.productId ?? null,
      qty: input.qty,
      unitPriceCents: unitPrice,
      totalCents,
    };

    const updated = await this.sales.findOneAndUpdate(
      { _id: saleId },
      {
        $push: { items: newItem },
        $inc: { subtotalCents: totalCents, totalCents: totalCents },
      },
      { new: true },
    );
    return updated!;
  }

  async addPayment(saleId: string, input: AddPaymentInput): Promise<SaleDocument> {
    if (input.amountCents <= 0) throw new InvalidArgument('amountCents must be > 0');

    const sale = await this.sales.findOne({ _id: saleId, status: 'OPEN' });
    if (!sale) throw new BusinessRuleViolation('Sale not found or not OPEN');

    const newPayment = {
      id: uuidv4(),
      method: input.method,
      amountCents: input.amountCents,
      reference: input.reference ?? null,
      paidAt: new Date(),
    };
    const updated = await this.sales.findOneAndUpdate(
      { _id: saleId },
      { $push: { payments: newPayment } },
      { new: true },
    );
    return updated!;
  }

  async close(saleId: string): Promise<SaleDocument> {
    const session = await this.connection.startSession();
    try {
      return await session.withTransaction(async () => {
        const sale = await this.sales.findOne({ _id: saleId, status: 'OPEN' }, null, { session });
        if (!sale) throw new BusinessRuleViolation('Sale not found or not OPEN');

        if (sale.items.length === 0) throw new BusinessRuleViolation('Sale has no items');

        const subtotal = sale.items.reduce((s, i) => s + i.totalCents, 0);

        // VIP discount
        let discount = 0;
        if (sale.customerId) {
          const now = new Date();
          const membership = await this.memberships.findOne({
            customerId: sale.customerId,
            active: true,
            startsAt: { $lte: now },
            endsAt: { $gt: now },
          }, null, { session }).sort({ discountPct: -1 });
          if (membership) {
            const pct = parseFloat(membership.discountPct);
            discount = Math.floor((subtotal * pct) / 100);
          }
        }

        const total = Math.max(0, subtotal - discount);
        const paid = sale.payments.reduce((s, p) => s + p.amountCents, 0);
        if (paid < total) {
          throw new BusinessRuleViolation('Payments are less than total', { total, paid });
        }

        // Decrement stock for product items
        for (const it of sale.items.filter((i) => i.kind === 'PRODUCT' && i.productId)) {
          await this.inventory.decrement(
            {
              productId: it.productId!,
              qty: it.qty,
              reason: `Sale ${sale._id}`,
              refType: 'SALE',
              refId: sale._id,
            },
            session,
          );
        }

        const ctx = requestContext.get();
        const updated = await this.sales.findOneAndUpdate(
          { _id: saleId },
          {
            $set: {
              subtotalCents: subtotal,
              discountCents: discount,
              taxCents: 0,
              totalCents: total,
              status: 'CLOSED',
              closedAt: new Date(),
              closedBy: ctx?.userId ?? null,
            },
          },
          { new: true, session },
        );

        // Auto-complete linked appointment
        if (sale.appointmentId) {
          await this.appts.findOneAndUpdate(
            { _id: sale.appointmentId, status: { $in: ['BOOKED', 'CONFIRMED'] } },
            { $set: { status: 'COMPLETED' } },
            { session },
          );
        }

        // Loyalty points: 1 point per 100 cents
        if (sale.customerId) {
          const points = Math.floor(total / 100);
          if (points > 0) {
            await this.customers.findOneAndUpdate(
              { _id: sale.customerId },
              { $inc: { loyaltyPoints: points } },
              { session },
            );
          }
        }

        return updated!;
      });
    } finally {
      await session.endSession();
    }
  }

  async void(saleId: string, reason?: string): Promise<SaleDocument> {
    const sale = await this.sales.findOne({ _id: saleId });
    if (!sale) throw new EntityNotFound('Sale not found');
    if (sale.status === 'VOIDED') return sale;

    if (sale.status === 'CLOSED') {
      for (const it of sale.items.filter((i) => i.kind === 'PRODUCT' && i.productId)) {
        await this.inventory.increment({
          productId: it.productId!,
          qty: it.qty,
          reason: `Void sale ${sale._id}: ${reason ?? ''}`,
          refType: 'SALE_VOID',
          refId: sale._id,
        });
      }
    }

    const updated = await this.sales.findOneAndUpdate(
      { _id: saleId },
      { $set: { status: 'VOIDED' } },
      { new: true },
    );
    return updated!;
  }

  async commissionFor(saleId: string): Promise<{
    saleId: string;
    barberId: string | null;
    commissionPct: number;
    commissionCents: number;
  }> {
    const sale = await this.sales.findOne({ _id: saleId });
    if (!sale) throw new EntityNotFound('Sale not found');
    if (sale.status !== 'CLOSED') throw new BusinessRuleViolation('Sale must be CLOSED');
    if (!sale.barberId) return { saleId, barberId: null, commissionPct: 0, commissionCents: 0 };

    const barber = await this.barbers.findOne({ _id: sale.barberId });
    const pct = barber ? parseFloat(barber.commissionPct) : 0;
    const serviceSub = sale.items
      .filter((i) => i.kind === 'SERVICE')
      .reduce((s, i) => s + i.totalCents, 0);
    const proportion = sale.subtotalCents > 0 ? serviceSub / sale.subtotalCents : 0;
    const baseAfterDiscount = Math.floor(sale.totalCents * proportion);
    const commissionCents = Math.floor((baseAfterDiscount * pct) / 100);
    return { saleId, barberId: sale.barberId, commissionPct: pct, commissionCents };
  }

  async getById(id: string): Promise<SaleDocument> {
    const s = await this.sales.findOne({ _id: id });
    if (!s) throw new EntityNotFound('Sale not found');
    return s;
  }
}
