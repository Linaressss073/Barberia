import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { JwtDenylist } from '../../application/ports/jwt-denylist.port';
import { JwtDenylistOrmEntity } from './jwt-denylist.orm-entity';

@Injectable()
export class TypeOrmJwtDenylist implements JwtDenylist {
  constructor(
    @InjectRepository(JwtDenylistOrmEntity)
    private readonly repo: Repository<JwtDenylistOrmEntity>,
  ) {}

  async isRevoked(jti: string): Promise<boolean> {
    const row = await this.repo.findOne({ where: { jti } });
    return !!row;
  }

  async revoke(jti: string, expiresAt: Date): Promise<void> {
    await this.repo.upsert({ jti, expiresAt }, ['jti']);
  }

  async purgeExpired(): Promise<number> {
    const r = await this.repo.delete({ expiresAt: LessThan(new Date()) });
    return r.affected ?? 0;
  }
}
