import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { BusinessRuleViolation, EntityNotFound } from '@core/exceptions/domain.exception';
import { requestContext } from '@core/context/request-context';
import { InventoryProductOrmEntity } from '../infrastructure/persistence/inventory-product.orm-entity';
import {
  InventoryMovementOrmEntity,
  MovementType,
} from '../infrastructure/persistence/inventory-movement.orm-entity';

export interface StockAdjustment {
  productId: string;
  qty: number; // positivo siempre; el signo lo da `type`
  reason?: string;
  refType?: string;
  refId?: string;
}

/**
 * Servicio de dominio para mutaciones de stock.
 * Diseñado para ejecutarse opcionalmente dentro de un EntityManager transaccional
 * (necesario cuando una venta debe descontar stock atómicamente).
 *
 * Garantiza:
 *  - decremento atómico con UPDATE ... WHERE stock >= :qty (no negativo).
 *  - registro de movimiento auditable.
 */
@Injectable()
export class InventoryDomainService {
  /**
   * Decrementa stock atómicamente. Si stock insuficiente, lanza.
   */
  async decrement(em: EntityManager, adj: StockAdjustment): Promise<void> {
    if (adj.qty <= 0) throw new Error('qty must be > 0');
    const result = await em
      .createQueryBuilder()
      .update(InventoryProductOrmEntity)
      .set({ stock: () => `stock - ${adj.qty}` })
      .where('id = :id AND stock >= :qty AND deleted_at IS NULL', {
        id: adj.productId,
        qty: adj.qty,
      })
      .execute();

    if (!result.affected) {
      const exists = await em.findOne(InventoryProductOrmEntity, { where: { id: adj.productId } });
      if (!exists) throw new EntityNotFound('Product not found');
      throw new BusinessRuleViolation('Insufficient stock', {
        productId: adj.productId,
        requested: adj.qty,
      });
    }
    await this.recordMovement(em, 'OUT', adj);
  }

  async increment(em: EntityManager, adj: StockAdjustment): Promise<void> {
    if (adj.qty <= 0) throw new Error('qty must be > 0');
    const result = await em
      .createQueryBuilder()
      .update(InventoryProductOrmEntity)
      .set({ stock: () => `stock + ${adj.qty}` })
      .where('id = :id AND deleted_at IS NULL', { id: adj.productId })
      .execute();
    if (!result.affected) throw new EntityNotFound('Product not found');
    await this.recordMovement(em, 'IN', adj);
  }

  async adjust(
    em: EntityManager,
    productId: string,
    newStock: number,
    reason?: string,
  ): Promise<void> {
    if (newStock < 0) throw new BusinessRuleViolation('Stock cannot be negative');
    const before = await em.findOne(InventoryProductOrmEntity, { where: { id: productId } });
    if (!before) throw new EntityNotFound('Product not found');
    const delta = newStock - before.stock;
    await em.update(InventoryProductOrmEntity, { id: productId }, { stock: newStock });
    await this.recordMovement(em, 'ADJUST', {
      productId,
      qty: Math.abs(delta),
      reason: reason ?? `Adjusted from ${before.stock} to ${newStock}`,
    });
  }

  private async recordMovement(
    em: EntityManager,
    type: MovementType,
    adj: StockAdjustment,
  ): Promise<void> {
    const ctx = requestContext.get();
    await em.insert(InventoryMovementOrmEntity, {
      productId: adj.productId,
      type,
      qty: adj.qty,
      reason: adj.reason ?? null,
      refType: adj.refType ?? null,
      refId: adj.refId ?? null,
      createdBy: ctx?.userId ?? null,
    });
  }
}
