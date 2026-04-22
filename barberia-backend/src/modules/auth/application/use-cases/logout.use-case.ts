import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';
import { JWT_DENYLIST, JwtDenylist } from '../ports/jwt-denylist.port';

export interface LogoutInput {
  userId: string;
  jti: string;
  exp: number;
}

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(JWT_DENYLIST) private readonly denylist: JwtDenylist,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    await this.refreshTokens.revokeAllForUser(new UniqueEntityId(input.userId));
    const expiresAt = new Date(input.exp * 1000);
    await this.denylist.revoke(input.jti, expiresAt);
  }
}
