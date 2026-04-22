import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type MovementType = 'IN' | 'OUT' | 'ADJUST';

@Entity({ name: 'inventory_movements' })
@Index('ix_inventory_movements_product_id_created_at', ['productId', 'createdAt'])
export class InventoryMovementOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @Column({ type: 'varchar', length: 8 })
  type!: MovementType;

  @Column({ type: 'int' })
  qty!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  refType!: string | null;

  @Column({ type: 'uuid', nullable: true })
  refId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
