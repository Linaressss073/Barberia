import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityConflict, EntityNotFound } from '@core/exceptions/domain.exception';
import { requestContext } from '@core/context/request-context';
import {
  InventoryProductDoc,
  InventoryProductDocument,
} from '../infrastructure/persistence/inventory-product.schema';
import { InventoryDomainService } from '../domain/inventory.service';
import { Page, buildPage } from '@shared/pagination/pagination.dto';
import { v4 as uuidv4 } from 'uuid';

export interface CreateProductInput {
  sku: string;
  name: string;
  costCents: number;
  salePriceCents: number;
  initialStock?: number;
  minStock?: number;
}

export interface UpdateProductInput {
  name?: string;
  costCents?: number;
  salePriceCents?: number;
  minStock?: number;
  active?: boolean;
}

@Injectable()
export class InventoryUseCases {
  constructor(
    @InjectModel(InventoryProductDoc.name) private readonly products: Model<InventoryProductDocument>,
    private readonly domain: InventoryDomainService,
  ) {}

  private get tenantId(): string | null {
    return requestContext.get()?.tenantId ?? null;
  }

  async createProduct(input: CreateProductInput): Promise<InventoryProductDocument> {
    const tenantId = this.tenantId;
    const query: Record<string, unknown> = { sku: input.sku };
    if (tenantId) query['tenantId'] = tenantId;
    const exists = await this.products.findOne(query);
    if (exists) throw new EntityConflict('SKU already exists');
    return this.products.create({
      _id: uuidv4(),
      sku: input.sku,
      name: input.name,
      costCents: input.costCents,
      salePriceCents: input.salePriceCents,
      stock: input.initialStock ?? 0,
      minStock: input.minStock ?? 0,
      active: true,
      tenantId,
    });
  }

  async updateProduct(id: string, patch: UpdateProductInput): Promise<InventoryProductDocument> {
    const tenantId = this.tenantId;
    const filter: Record<string, unknown> = { _id: id };
    if (tenantId) filter['tenantId'] = tenantId;
    const doc = await this.products.findOneAndUpdate(filter, { $set: patch }, { new: true });
    if (!doc) throw new EntityNotFound('Product not found');
    return doc;
  }

  async getById(id: string): Promise<InventoryProductDocument> {
    const tenantId = this.tenantId;
    const filter: Record<string, unknown> = { _id: id };
    if (tenantId) filter['tenantId'] = tenantId;
    const doc = await this.products.findOne(filter);
    if (!doc) throw new EntityNotFound('Product not found');
    return doc;
  }

  async list(input: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<Page<InventoryProductDocument>> {
    const tenantId = this.tenantId;
    const query: Record<string, unknown> = {};
    if (tenantId) query['tenantId'] = tenantId;
    if (input.search) {
      query['$or'] = [
        { sku: { $regex: input.search, $options: 'i' } },
        { name: { $regex: input.search, $options: 'i' } },
      ];
    }
    const skip = (input.page - 1) * input.limit;
    const [items, total] = await Promise.all([
      this.products.find(query).sort({ name: 1 }).skip(skip).limit(input.limit),
      this.products.countDocuments(query),
    ]);
    return buildPage(items, total, input.page, input.limit);
  }

  async listLowStock(): Promise<InventoryProductDocument[]> {
    const tenantId = this.tenantId;
    const query: Record<string, unknown> = { active: true, $expr: { $lte: ['$stock', '$minStock'] } };
    if (tenantId) query['tenantId'] = tenantId;
    return this.products.find(query).sort({ stock: 1 });
  }

  async registerIn(productId: string, qty: number, reason?: string): Promise<void> {
    await this.domain.increment({ productId, qty, reason });
  }

  async registerOut(productId: string, qty: number, reason?: string): Promise<void> {
    await this.domain.decrement({ productId, qty, reason });
  }

  async adjust(productId: string, newStock: number, reason?: string): Promise<void> {
    await this.domain.adjust(productId, newStock, reason);
  }
}
