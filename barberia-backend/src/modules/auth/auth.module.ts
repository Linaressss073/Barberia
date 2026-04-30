import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';

import { UserDoc, UserSchema } from './infrastructure/persistence/user.schema';
import { RefreshTokenDoc, RefreshTokenSchema } from './infrastructure/persistence/refresh-token.schema';
import { JwtDenylistDoc, JwtDenylistSchema } from './infrastructure/persistence/jwt-denylist.schema';
import { MongoUserRepository } from './infrastructure/persistence/typeorm-user.repository';
import { MongoRefreshTokenRepository } from './infrastructure/persistence/typeorm-refresh-token.repository';
import { MongoJwtDenylist } from './infrastructure/persistence/typeorm-jwt-denylist';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtTokenSigner } from './infrastructure/security/jwt-token-signer';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';

import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { TOKEN_SIGNER } from './application/ports/token-signer.port';
import { JWT_DENYLIST } from './application/ports/jwt-denylist.port';

import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';

import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserDoc.name, schema: UserSchema },
      { name: RefreshTokenDoc.name, schema: RefreshTokenSchema },
      { name: JwtDenylistDoc.name, schema: JwtDenylistSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    { provide: USER_REPOSITORY, useClass: MongoUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: MongoRefreshTokenRepository },
    { provide: JWT_DENYLIST, useClass: MongoJwtDenylist },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SIGNER, useClass: JwtTokenSigner },
    RegisterUserUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
  ],
  exports: [USER_REPOSITORY, PASSWORD_HASHER, MongooseModule],
})
export class AuthModule {}
