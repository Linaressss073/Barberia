import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AppointmentItemOrmEntity } from './appointment-item.orm-entity';

export type AppointmentStatus = 'BOOKED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type AppointmentSource = 'WEB' | 'PHONE' | 'WALKIN' | 'ADMIN';

@Entity({ name: 'appointments' })
@Index('ix_appointments_barber_id_scheduled_at', ['barberId', 'scheduledAt'])
@Index('ix_appointments_customer_id_scheduled_at', ['customerId', 'scheduledAt'])
export class AppointmentOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  customerId!: string;

  @Column({ type: 'uuid' })
  barberId!: string;

  @Column({ type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ type: 'timestamptz' })
  endsAt!: Date;

  @Column({ type: 'varchar', length: 16, default: 'BOOKED' })
  status!: AppointmentStatus;

  @Column({ type: 'varchar', length: 16, default: 'WEB' })
  source!: AppointmentSource;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancelReason!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => AppointmentItemOrmEntity, (i) => i.appointment, { cascade: true, eager: true })
  items!: AppointmentItemOrmEntity[];
}
