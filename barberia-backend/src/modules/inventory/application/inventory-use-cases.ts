import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { EntityConflict, EntityNotFound } from '@core/exceptions/domain.exception';
import { InventoryProductOrmEntity } from '../infrastructure/persistence/inventory-product.orm-entity';
import { InventoryDomainService } from '../domain/inventory.service';
import { Page, buildPage } from '@shared/pagination/pagination.dto';

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
    @InjectDataSource() private readonly ds: DataSource,
    @InjectRepository(InventoryProductOrmEntity)
    private readonly products: Repository<InventoryProductOrmEntity>,
    private readonly domain: InventoryDomainService,
  ) {}

  async createProduct(input: CreateProductInput): Promise<InventoryProductOrmEntity> {
    const exists = await this.products.findOne({ where: { sku: input.sku } });
    if (exists) throw new EntityConflict('SKU already exists');
    const created = await this.products.save(
      this.products.create({
        sku: input.sku,
        name: input.name,
        costCents: input.costCents,
        salePriceCents: input.salePriceCents,
        stock: input.initialStock ?? 0,
        minStock: input.minStock ?? 0,
        active: true,
      }),
    );
    return created;
  }

  async updateProduct(id: string, patch: UpdateProductInput): Promise<InventoryProductOrmEntity> {
    const p = await this.products.findOne({ where: { id } });
    if (!p) throw new EntityNotFound('Product not found');
    Object.assign(p, patch);
    return this.products.save(p);
  }

  async getById(id: string): Promise<InventoryProductOrmEntity> {
    const p = await this.products.findOne({ where: { id } });
    if (!p) throw new EntityNotFound('Product not found');
    return p;
  }

  async list(input: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<Page<InventoryProductOrmEntity>> {
    const qb = this.products
      .createQueryBuilder('p')
      .orderBy('p.name', 'ASC')
      .skip((input.page - 1) * input.limit)
      .take(input.limit);
    if (input.search)
      qb.andWhere('(p.sku ILIKE :s OR p.name ILIKE :s)', { s: `%${input.search}%` });
    const [items, total] = await qb.getManyAndCount();
    return buildPage(items, total, input.page, input.limit);
  }

  async listLowStock(): Promise<InventoryProductOrmEntity[]> {
    return this.products
      .find({
        where: { active: true, stock: LessThanOrEqual(0) }, // overridden below
      })
      .then(async () => {
        // raw query because we need column-to-column comparison
        return this.products
          .createQueryBuilder('p')
          .where('p.active = true AND p.stock <= p.min_stock')
          .orderBy('p.stock', 'ASC')
          .getMany();
      });
  }

  async registerIn(productId: string, qty: number, reason?: string): Promise<void> {
    await this.ds.transaction((em) => this.domain.increment(em, { productId, qty, reason }));
  }

  async registerOut(productId: string, qty: number, reason?: string): Promise<void> {
    await this.ds.transaction((em) => this.domain.decrement(em, { productId, qty, reason }));
  }

  async adjust(productId: string, newStock: number, reason?: string): Promise<void> {
    await this.ds.transaction((em) => this.domain.adjust(em, productId, newStock, reason));
  }
}
