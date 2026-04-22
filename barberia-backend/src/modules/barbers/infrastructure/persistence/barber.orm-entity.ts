import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BarberScheduleOrmEntity } from './barber-schedule.orm-entity';

@Entity({ name: 'barbers' })
export class BarberOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 120 })
  displayName!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  specialty!: string | null;

  @Column({ type: 'date' })
  hireDate!: Date;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  commissionPct!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 0 })
  ratingAvg!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => BarberScheduleOrmEntity, (s) => s.barber, { cascade: true, eager: true })
  schedules!: BarberScheduleOrmEntity[];
}
