import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ServiceOrmEntity } from './service.orm-entity';

@Entity({ name: 'service_promotions' })
export class ServicePromotionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  serviceId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  discountPct!: string;

  @Column({ type: 'timestamptz' })
  validFrom!: Date;

  @Column({ type: 'timestamptz' })
  validTo!: Date;

  @ManyToOne(() => ServiceOrmEntity, (s) => s.promotions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service!: ServiceOrmEntity;
}
