import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import {
  BusinessRuleViolation,
  EntityConflict,
  EntityNotFound,
  InvalidArgument,
} from '@core/exceptions/domain.exception';
import { requestContext } from '@core/context/request-context';
import { SaleOrmEntity } from '../infrastructure/persistence/sale.orm-entity';
import {
  SaleItemKind,
  SaleItemOrmEntity,
} from '../infrastructure/persistence/sale-item.orm-entity';
import { PaymentMethod, PaymentOrmEntity } from '../infrastructure/persistence/payment.orm-entity';
import { ServiceOrmEntity } from '@modules/services/infrastructure/persistence/service.orm-entity';
import { InventoryProductOrmEntity } from '@modules/inventory/infrastructure/persistence/inventory-product.orm-entity';
import { InventoryDomainService } from '@modules/inventory/domain/inventory.service';
import { CustomerOrmEntity } from '@modules/customers/infrastructure/persistence/customer.orm-entity';
import { MembershipOrmEntity } from '@modules/memberships/infrastructure/persistence/membership.orm-entity';
import { BarberOrmEntity } from '@modules/barbers/infrastructure/persistence/barber.orm-entity';
import { AppointmentOrmEntity } from '@modules/appointments/infrastructure/persistence/appointment.orm-entity';

export interface OpenSaleInput {
  customerId?: string;
  barberId?: string;
  appointmentId?: string;
}

export interface AddItemInput {
  kind: SaleItemKind;
  serviceId?: string;
  productId?: string;
  qty: number;
}

export interface AddPaymentInput {
  method: PaymentMethod;
  amountCents: number;
  reference?: string;
}

@Injectable()
export class SalesUseCases {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly inventory: InventoryDomainService,
  ) {}

  async open(input: OpenSaleInput): Promise<SaleOrmEntity> {
    return this.ds.transaction(async (em) => {
      if (input.appointmentId) {
        const exists = await em.findOne(SaleOrmEntity, {
          where: { appointmentId: input.appointmentId },
        });
        if (exists) throw new EntityConflict('Sale already exists for this appointment');
      }
      const ctx = requestContext.get();
      const sale = await em.save(SaleOrmEntity, {
        customerId: input.customerId ?? null,
        barberId: input.barberId ?? null,
        appointmentId: input.appointmentId ?? null,
        status: 'OPEN',
        createdBy: ctx?.userId ?? null,
      });
      sale.items = [];
      sale.payments = [];
      return sale;
    });
  }

  async addItem(saleId: string, input: AddItemInput): Promise<SaleOrmEntity> {
    if (input.qty <= 0) throw new InvalidArgument('qty must be > 0');
    return this.ds.transaction(async (em) => {
      const sale = await this.lockOpenSale(em, saleId);

      let unitPrice = 0;
      if (input.kind === 'SERVICE') {
        if (!input.serviceId) throw new InvalidArgument('serviceId is required');
        const svc = await em.findOne(ServiceOrmEntity, { where: { id: input.serviceId } });
        if (!svc) throw new EntityNotFound('Service not found');
        unitPrice = svc.priceCents;
      } else if (input.kind === 'PRODUCT') {
        if (!input.productId) throw new InvalidArgument('productId is required');
        const prod = await em.findOne(InventoryProductOrmEntity, {
          where: { id: input.productId },
        });
        if (!prod) throw new EntityNotFound('Product not found');
        unitPrice = prod.salePriceCents;
      } else {
        throw new InvalidArgument('Invalid item kind');
      }

      const totalCents = unitPrice * input.qty;
      await em.insert(SaleItemOrmEntity, {
        saleId: sale.id,
        kind: input.kind,
        serviceId: input.serviceId ?? null,
        productId: input.productId ?? null,
        qty: input.qty,
        unitPriceCents: unitPrice,
        totalCents,
      });

      await this.recalcTotals(em, sale.id);
      return em.findOneOrFail(SaleOrmEntity, { where: { id: sale.id } });
    });
  }

  async addPayment(saleId: string, input: AddPaymentInput): Promise<SaleOrmEntity> {
    if (input.amountCents <= 0) throw new InvalidArgument('amountCents must be > 0');
    return this.ds.transaction(async (em) => {
      const sale = await this.lockOpenSale(em, saleId);
      await em.insert(PaymentOrmEntity, {
        saleId: sale.id,
        method: input.method,
        amountCents: input.amountCents,
        reference: input.reference ?? null,
      });
      return em.findOneOrFail(SaleOrmEntity, { where: { id: sale.id } });
    });
  }

  /**
   * Cierra la venta:
   *  - Aplica descuento VIP si el cliente tiene membresía activa.
   *  - Verifica payments >= total.
   *  - Decrementa stock atómicamente para items PRODUCT.
   *  - Marca CLOSED.
   *  - Si tiene appointmentId, marca la cita COMPLETED si seguía abierta.
   */
  async close(saleId: string): Promise<SaleOrmEntity> {
    return this.ds.transaction('SERIALIZABLE', async (em) => {
      const sale = await this.lockOpenSale(em, saleId);

      // Re-cargar items y payments siempre actualizados
      const items = await em.find(SaleItemOrmEntity, { where: { saleId: sale.id } });
      const payments = await em.find(PaymentOrmEntity, { where: { saleId: sale.id } });
      if (items.length === 0) throw new BusinessRuleViolation('Sale has no items');

      const subtotal = items.reduce((s, i) => s + i.totalCents, 0);

      // Descuento VIP
      let discount = 0;
      if (sale.customerId) {
        const membership = await em
          .createQueryBuilder(MembershipOrmEntity, 'm')
          .where('m.customer_id = :id AND m.active = true', { id: sale.customerId })
          .andWhere('m.starts_at <= now() AND m.ends_at > now()')
          .orderBy('m.discount_pct', 'DESC')
          .getOne();
        if (membership) {
          const pct = parseFloat(membership.discountPct);
          discount = Math.floor((subtotal * pct) / 100);
        }
      }

      const total = Math.max(0, subtotal - discount);
      const paid = payments.reduce((s, p) => s + p.amountCents, 0);
      if (paid < total) {
        throw new BusinessRuleViolation('Payments are less than total', { total, paid });
      }

      // Descuento de stock para productos
      for (const it of items.filter((i) => i.kind === 'PRODUCT' && i.productId)) {
        await this.inventory.decrement(em, {
          productId: it.productId!,
          qty: it.qty,
          reason: `Sale ${sale.id}`,
          refType: 'SALE',
          refId: sale.id,
        });
      }

      const ctx = requestContext.get();
      await em.update(
        SaleOrmEntity,
        { id: sale.id },
        {
          subtotalCents: subtotal,
          discountCents: discount,
          taxCents: 0,
          totalCents: total,
          status: 'CLOSED',
          closedAt: new Date(),
          closedBy: ctx?.userId ?? null,
        },
      );

      // Cierre automático de cita si aplica
      if (sale.appointmentId) {
        await em
          .createQueryBuilder()
          .update(AppointmentOrmEntity)
          .set({ status: 'COMPLETED' })
          .where("id = :id AND status IN ('BOOKED','CONFIRMED')", { id: sale.appointmentId })
          .execute();
      }

      // Loyalty: 1 punto por cada 10 unidades monetarias del total (ej: $1 = 100 cents → 10 pts)
      if (sale.customerId) {
        const points = Math.floor(total / 100);
        if (points > 0) {
          await em
            .createQueryBuilder()
            .update(CustomerOrmEntity)
            .set({ loyaltyPoints: () => `loyalty_points + ${points}` })
            .where({ id: sale.customerId })
            .execute();
        }
      }

      return em.findOneOrFail(SaleOrmEntity, { where: { id: sale.id } });
    });
  }

  async void(saleId: string, reason?: string): Promise<SaleOrmEntity> {
    return this.ds.transaction(async (em) => {
      const sale = await em.findOne(SaleOrmEntity, { where: { id: saleId } });
      if (!sale) throw new EntityNotFound('Sale not found');
      if (sale.status === 'VOIDED') return sale;
      if (sale.status === 'CLOSED') {
        // Re-stock: por simplicidad, increment back
        const items = await em.find(SaleItemOrmEntity, { where: { saleId: sale.id } });
        for (const it of items.filter((i) => i.kind === 'PRODUCT' && i.productId)) {
          await this.inventory.increment(em, {
            productId: it.productId!,
            qty: it.qty,
            reason: `Void sale ${sale.id}: ${reason ?? ''}`,
            refType: 'SALE_VOID',
            refId: sale.id,
          });
        }
      }
      await em.update(SaleOrmEntity, { id: sale.id }, { status: 'VOIDED' });
      return em.findOneOrFail(SaleOrmEntity, { where: { id: sale.id } });
    });
  }

  /**
   * Calcula la comisión del barbero para una venta cerrada.
   * No persiste; queda como lectura para reports.
   */
  async commissionFor(saleId: string): Promise<{
    saleId: string;
    barberId: string | null;
    commissionPct: number;
    commissionCents: number;
  }> {
    const sale = await this.ds.getRepository(SaleOrmEntity).findOne({ where: { id: saleId } });
    if (!sale) throw new EntityNotFound('Sale not found');
    if (sale.status !== 'CLOSED') throw new BusinessRuleViolation('Sale must be CLOSED');
    if (!sale.barberId) return { saleId, barberId: null, commissionPct: 0, commissionCents: 0 };
    const barber = await this.ds
      .getRepository(BarberOrmEntity)
      .findOne({ where: { id: sale.barberId } });
    const pct = barber ? parseFloat(barber.commissionPct) : 0;
    // Comisión sobre subtotal de SERVICIOS (no productos), descontando el descuento VIP proporcional
    const items = await this.ds.getRepository(SaleItemOrmEntity).find({ where: { saleId } });
    const serviceSub = items
      .filter((i) => i.kind === 'SERVICE')
      .reduce((s, i) => s + i.totalCents, 0);
    const proportion = sale.subtotalCents > 0 ? serviceSub / sale.subtotalCents : 0;
    const baseAfterDiscount = Math.floor(sale.totalCents * proportion);
    const commissionCents = Math.floor((baseAfterDiscount * pct) / 100);
    return { saleId, barberId: sale.barberId, commissionPct: pct, commissionCents };
  }

  async getById(id: string): Promise<SaleOrmEntity> {
    const s = await this.ds.getRepository(SaleOrmEntity).findOne({ where: { id } });
    if (!s) throw new EntityNotFound('Sale not found');
    return s;
  }

  // ---- helpers ----------------------------------------------------------

  private async lockOpenSale(em: EntityManager, saleId: string): Promise<SaleOrmEntity> {
    const sale = await em
      .createQueryBuilder(SaleOrmEntity, 's')
      .setLock('pessimistic_write')
      .where('s.id = :id', { id: saleId })
      .getOne();
    if (!sale) throw new EntityNotFound('Sale not found');
    if (sale.status !== 'OPEN') throw new BusinessRuleViolation(`Sale is ${sale.status}`);
    return sale;
  }

  private async recalcTotals(em: EntityManager, saleId: string): Promise<void> {
    const items = await em.find(SaleItemOrmEntity, { where: { saleId } });
    const subtotal = items.reduce((s, i) => s + i.totalCents, 0);
    await em.update(
      SaleOrmEntity,
      { id: saleId },
      { subtotalCents: subtotal, totalCents: subtotal },
    );
  }
}
