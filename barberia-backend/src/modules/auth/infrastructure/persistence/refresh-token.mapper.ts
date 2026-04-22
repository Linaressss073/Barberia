import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { RefreshTokenOrmEntity } from './refresh-token.orm-entity';

export class RefreshTokenMapper {
  static toDomain(orm: RefreshTokenOrmEntity): RefreshToken {
    return RefreshToken.rehydrate(
      {
        userId: new UniqueEntityId(orm.userId),
        tokenHash: orm.tokenHash,
        expiresAt: orm.expiresAt,
        revokedAt: orm.revokedAt,
        createdAt: orm.createdAt,
      },
      new UniqueEntityId(orm.id),
    );
  }

  static toOrm(domain: RefreshToken): RefreshTokenOrmEntity {
    const orm = new RefreshTokenOrmEntity();
    orm.id = domain.id.value;
    orm.userId = domain.userId.value;
    orm.tokenHash = domain.tokenHash;
    orm.expiresAt = domain.expiresAt;
    orm.revokedAt = domain.revokedAt ?? null;
    return orm;
  }
}
