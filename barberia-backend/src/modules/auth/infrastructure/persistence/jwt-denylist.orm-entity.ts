import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'jwt_denylist' })
@Index('ix_jwt_denylist_expires_at', ['expiresAt'])
export class JwtDenylistOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  jti!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
