import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityConflict, EntityNotFound } from '@core/exceptions/domain.exception';
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

  async createProduct(input: CreateProductInput): Promise<InventoryProductDocument> {
    const exists = await this.products.findOne({ sku: input.sku });
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
    });
  }

  async updateProduct(id: string, patch: UpdateProductInput): Promise<InventoryProductDocument> {
    const doc = await this.products.findOneAndUpdate(
      { _id: id },
      { $set: patch },
      { new: true },
    );
    if (!doc) throw new EntityNotFound('Product not found');
    return doc;
  }

  async getById(id: string): Promise<InventoryProductDocument> {
    const doc = await this.products.findOne({ _id: id });
    if (!doc) throw new EntityNotFound('Product not found');
    return doc;
  }

  async list(input: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<Page<InventoryProductDocument>> {
    const query: Record<string, unknown> = {};
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
    return this.products
      .find({ active: true, $expr: { $lte: ['$stock', '$minStock'] } })
      .sort({ stock: 1 });
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
