import { Inject, Injectable } from '@nestjs/common';
import { Email } from '@shared/kernel/email.vo';
import { EntityConflict, InvalidArgument } from '@core/exceptions/domain.exception';
import { Role } from '@core/decorators/roles.decorator';
import { USER_REPOSITORY, UserRepository } from '@modules/auth/domain/repositories/user.repository';
import { User, UserStatus } from '@modules/auth/domain/entities/user.entity';
import { HashedPassword } from '@modules/auth/domain/value-objects/hashed-password.vo';
import { RawPassword } from '@modules/auth/domain/value-objects/raw-password.vo';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '@modules/auth/application/ports/password-hasher.port';

export interface AdminCreateUserInput {
  email: string;
  fullName: string;
  password: string;
  roles: Role[];
}

@Injectable()
export class AdminCreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: AdminCreateUserInput): Promise<User> {
    const emailRes = Email.create(input.email);
    if (emailRes.isFailure) throw new InvalidArgument(emailRes.getError(), { field: 'email' });
    const passRes = RawPassword.create(input.password);
    if (passRes.isFailure) throw new InvalidArgument(passRes.getError(), { field: 'password' });

    if (await this.users.existsByEmail(emailRes.getValue())) {
      throw new EntityConflict('Email already registered');
    }
    const hash = await this.hasher.hash(passRes.getValue().value);
    const user = User.create({
      email: emailRes.getValue(),
      fullName: input.fullName,
      password: HashedPassword.fromHash(hash),
      roles: input.roles,
      status: UserStatus.Active,
    });
    await this.users.save(user);
    return user;
  }
}
