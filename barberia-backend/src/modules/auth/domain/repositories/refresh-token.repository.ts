import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { RefreshToken } from '../entities/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface RefreshTokenRepository {
  save(token: RefreshToken): Promise<void>;
  findActiveByHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeAllForUser(userId: UniqueEntityId): Promise<void>;
}
