import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { RefreshTokenDocument } from './refresh-token.schema';

export class RefreshTokenMapper {
  static toDomain(doc: RefreshTokenDocument): RefreshToken {
    return RefreshToken.rehydrate(
      {
        userId: new UniqueEntityId(doc.userId),
        tokenHash: doc.tokenHash,
        expiresAt: doc.expiresAt,
        revokedAt: doc.revokedAt,
        createdAt: doc.createdAt,
      },
      new UniqueEntityId(doc._id),
    );
  }

  static toDoc(domain: RefreshToken): Record<string, unknown> {
    return {
      _id: domain.id.value,
      userId: domain.userId.value,
      tokenHash: domain.tokenHash,
      expiresAt: domain.expiresAt,
      revokedAt: domain.revokedAt ?? null,
    };
  }
}
