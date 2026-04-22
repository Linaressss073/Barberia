import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SaleItemOrmEntity } from './sale-item.orm-entity';
import { PaymentOrmEntity } from './payment.orm-entity';

export type SaleStatus = 'OPEN' | 'CLOSED' | 'VOIDED';

@Entity({ name: 'sales' })
@Index('ix_sales_status_created_at', ['status', 'createdAt'])
export class SaleOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  customerId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  barberId!: string | null;

  @Column({ type: 'uuid', nullable: true, unique: true })
  appointmentId!: string | null;

  @Column({ type: 'int', default: 0 })
  subtotalCents!: number;

  @Column({ type: 'int', default: 0 })
  discountCents!: number;

  @Column({ type: 'int', default: 0 })
  taxCents!: number;

  @Column({ type: 'int', default: 0 })
  totalCents!: number;

  @Column({ type: 'varchar', length: 16, default: 'OPEN' })
  status!: SaleStatus;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  closedBy!: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => SaleItemOrmEntity, (i) => i.sale, { cascade: true, eager: true })
  items!: SaleItemOrmEntity[];

  @OneToMany(() => PaymentOrmEntity, (p) => p.sale, { cascade: true, eager: true })
  payments!: PaymentOrmEntity[];
}
