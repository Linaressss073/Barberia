import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AppointmentOrmEntity } from './appointment.orm-entity';

@Entity({ name: 'appointment_items' })
export class AppointmentItemOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  appointmentId!: string;

  @Column({ type: 'uuid' })
  serviceId!: string;

  @Column({ type: 'int' })
  priceCents!: number;

  @Column({ type: 'int' })
  durationMin!: number;

  @ManyToOne(() => AppointmentOrmEntity, (a) => a.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment!: AppointmentOrmEntity;
}
