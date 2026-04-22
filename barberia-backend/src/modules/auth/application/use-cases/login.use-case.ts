import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { Unauthorized } from '@core/exceptions/domain.exception';
import { Email } from '@shared/kernel/email.vo';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { PASSWORD_HASHER, PasswordHasher } from '../ports/password-hasher.port';
import { TOKEN_SIGNER, TokenSigner } from '../ports/token-signer.port';
import { AuthResponseDto } from '../dto/auth-response.dto';

export interface LoginInput {
  email: string;
  password: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SIGNER) private readonly signer: TokenSigner,
  ) {}

  async execute(input: LoginInput): Promise<AuthResponseDto> {
    const emailRes = Email.create(input.email);
    if (emailRes.isFailure) throw new Unauthorized('Invalid credentials');

    const user = await this.users.findByEmail(emailRes.getValue());
    if (!user) throw new Unauthorized('Invalid credentials');

    const passwordOk = await this.hasher.compare(input.password, user.password.value);
    if (!passwordOk) throw new Unauthorized('Invalid credentials');

    user.ensureCanLogin();
    user.recordLogin();
    await this.users.save(user);

    const access = await this.signer.signAccessToken({
      sub: user.id.value,
      email: user.email.value,
      roles: user.roles,
    });
    const refreshJti = randomUUID();
    const refreshToken = await this.signer.signRefreshToken({
      sub: user.id.value,
      jti: refreshJti,
    });

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.refreshTokens.save(
      RefreshToken.issue({
        userId: user.id,
        tokenHash,
        ttlMs: this.signer.refreshTtlMs(),
      }),
    );

    return {
      user: {
        id: user.id.value,
        email: user.email.value,
        fullName: user.fullName,
        roles: user.roles,
      },
      tokens: {
        accessToken: access.token,
        refreshToken,
        tokenType: 'Bearer',
      },
    };
  }
}
