import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { Unauthorized } from '@core/exceptions/domain.exception';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { TOKEN_SIGNER, TokenSigner } from '../ports/token-signer.port';
import { AuthTokensDto } from '../dto/auth-response.dto';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(TOKEN_SIGNER) private readonly signer: TokenSigner,
  ) {}

  async execute(rawRefreshToken: string): Promise<AuthTokensDto> {
    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');
    const stored = await this.refreshTokens.findActiveByHash(tokenHash);
    if (!stored || !stored.isActive()) throw new Unauthorized('Invalid refresh token');

    const user = await this.users.findById(stored.userId);
    if (!user || !user.isActive()) throw new Unauthorized('User no longer active');

    await this.refreshTokens.revokeAllForUser(user.id);

    const access = await this.signer.signAccessToken({
      sub: user.id.value,
      email: user.email.value,
      roles: user.roles,
    });
    const newJti = randomUUID();
    const refreshToken = await this.signer.signRefreshToken({
      sub: user.id.value,
      jti: newJti,
    });
    const newHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.refreshTokens.save(
      RefreshToken.issue({
        userId: user.id,
        tokenHash: newHash,
        ttlMs: this.signer.refreshTtlMs(),
      }),
    );

    return { accessToken: access.token, refreshToken, tokenType: 'Bearer' };
  }
}
