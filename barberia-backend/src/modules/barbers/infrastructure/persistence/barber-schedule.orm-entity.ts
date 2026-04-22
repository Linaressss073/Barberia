import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BarberOrmEntity } from './barber.orm-entity';

@Entity({ name: 'barber_schedules' })
export class BarberScheduleOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  barberId!: string;

  @Column({ type: 'smallint' })
  weekday!: number;

  @Column({ type: 'time' })
  startTime!: string;

  @Column({ type: 'time' })
  endTime!: string;

  @ManyToOne(() => BarberOrmEntity, (b) => b.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'barber_id' })
  barber!: BarberOrmEntity;
}
