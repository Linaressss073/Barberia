import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigType } from '@nestjs/config';
import { PasswordHasher } from '../../application/ports/password-hasher.port';
import { jwtConfig } from '@config/jwt.config';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(@Inject(jwtConfig.KEY) private readonly cfg: ConfigType<typeof jwtConfig>) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.cfg.bcryptRounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
