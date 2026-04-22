import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SaleOrmEntity } from './sale.orm-entity';

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'YAPE' | 'PLIN' | 'OTHER';

@Entity({ name: 'payments' })
@Index('ix_payments_sale_id', ['saleId'])
export class PaymentOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  saleId!: string;

  @Column({ type: 'varchar', length: 16 })
  method!: PaymentMethod;

  @Column({ type: 'int' })
  amountCents!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'paid_at' })
  paidAt!: Date;

  @ManyToOne(() => SaleOrmEntity, (s) => s.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: SaleOrmEntity;
}
