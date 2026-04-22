import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { RefreshTokenOrmEntity } from './refresh-token.orm-entity';
import { RefreshTokenMapper } from './refresh-token.mapper';

@Injectable()
export class TypeOrmRefreshTokenRepository implements RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repo: Repository<RefreshTokenOrmEntity>,
  ) {}

  async save(token: RefreshToken): Promise<void> {
    await this.repo.save(RefreshTokenMapper.toOrm(token));
  }

  async findActiveByHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.repo.findOne({
      where: {
        tokenHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
    return row ? RefreshTokenMapper.toDomain(row) : null;
  }

  async revokeAllForUser(userId: UniqueEntityId): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(RefreshTokenOrmEntity)
      .set({ revokedAt: () => 'NOW()' })
      .where('user_id = :userId AND revoked_at IS NULL', { userId: userId.value })
      .execute();
  }
}
