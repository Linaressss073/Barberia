import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { BusinessRuleViolation, EntityNotFound } from '@core/exceptions/domain.exception';
import { requestContext } from '@core/context/request-context';
import {
  InventoryProductDoc,
  InventoryProductDocument,
} from '../infrastructure/persistence/inventory-product.schema';
import {
  InventoryMovementDoc,
  InventoryMovementDocument,
  MovementType,
} from '../infrastructure/persistence/inventory-movement.schema';

export interface StockAdjustment {
  productId: string;
  qty: number;
  reason?: string;
  refType?: string;
  refId?: string;
}

@Injectable()
export class InventoryDomainService {
  constructor(
    @InjectModel(InventoryProductDoc.name)
    private readonly products: Model<InventoryProductDocument>,
    @InjectModel(InventoryMovementDoc.name)
    private readonly movements: Model<InventoryMovementDocument>,
  ) {}

  async decrement(adj: StockAdjustment, session?: ClientSession): Promise<void> {
    if (adj.qty <= 0) throw new Error('qty must be > 0');
    const opts = session ? { session } : {};
    const result = await this.products.findOneAndUpdate(
      { _id: adj.productId, stock: { $gte: adj.qty }, deletedAt: null },
      { $inc: { stock: -adj.qty } },
      { ...opts, new: true },
    );
    if (!result) {
      const exists = await this.products.findOne({ _id: adj.productId });
      if (!exists) throw new EntityNotFound('Product not found');
      throw new BusinessRuleViolation('Insufficient stock', {
        productId: adj.productId,
        requested: adj.qty,
      });
    }
    await this.recordMovement('OUT', adj, session);
  }

  async increment(adj: StockAdjustment, session?: ClientSession): Promise<void> {
    if (adj.qty <= 0) throw new Error('qty must be > 0');
    const opts = session ? { session } : {};
    const result = await this.products.findOneAndUpdate(
      { _id: adj.productId, deletedAt: null },
      { $inc: { stock: adj.qty } },
      { ...opts, new: true },
    );
    if (!result) throw new EntityNotFound('Product not found');
    await this.recordMovement('IN', adj, session);
  }

  async adjust(productId: string, newStock: number, reason?: string, session?: ClientSession): Promise<void> {
    if (newStock < 0) throw new BusinessRuleViolation('Stock cannot be negative');
    const opts = session ? { session } : {};
    const before = await this.products.findOne({ _id: productId });
    if (!before) throw new EntityNotFound('Product not found');
    const delta = newStock - before.stock;
    await this.products.findOneAndUpdate({ _id: productId }, { $set: { stock: newStock } }, opts);
    await this.recordMovement(
      'ADJUST',
      {
        productId,
        qty: Math.abs(delta),
        reason: reason ?? `Adjusted from ${before.stock} to ${newStock}`,
      },
      session,
    );
  }

  private async recordMovement(
    type: MovementType,
    adj: StockAdjustment,
    session?: ClientSession,
  ): Promise<void> {
    const ctx = requestContext.get();
    const doc = {
      _id: uuidv4(),
      productId: adj.productId,
      type,
      qty: adj.qty,
      reason: adj.reason ?? null,
      refType: adj.refType ?? null,
      refId: adj.refId ?? null,
      createdBy: ctx?.userId ?? null,
    };
    if (session) {
      await this.movements.create([doc], { session });
    } else {
      await this.movements.create(doc);
    }
  }
}
