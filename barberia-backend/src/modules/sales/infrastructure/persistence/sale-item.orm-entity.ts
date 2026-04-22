import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SaleOrmEntity } from './sale.orm-entity';

export type SaleItemKind = 'SERVICE' | 'PRODUCT';

@Entity({ name: 'sale_items' })
export class SaleItemOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  saleId!: string;

  @Column({ type: 'varchar', length: 8 })
  kind!: SaleItemKind;

  @Column({ type: 'uuid', nullable: true })
  serviceId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  productId!: string | null;

  @Column({ type: 'int' })
  qty!: number;

  @Column({ type: 'int' })
  unitPriceCents!: number;

  @Column({ type: 'int' })
  totalCents!: number;

  @ManyToOne(() => SaleOrmEntity, (s) => s.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: SaleOrmEntity;
}
