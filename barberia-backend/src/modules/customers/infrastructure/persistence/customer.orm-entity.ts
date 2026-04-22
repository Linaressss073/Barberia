import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'customers' })
export class CustomerOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true, unique: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true, unique: true })
  document!: string | null;

  @Column({ type: 'varchar', length: 120 })
  @Index('ix_customers_full_name')
  fullName!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'date', nullable: true })
  birthdate!: Date | null;

  @Column({ type: 'int', default: 0 })
  loyaltyPoints!: number;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  preferences!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
