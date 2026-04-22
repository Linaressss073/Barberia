import { Inject, Injectable } from '@nestjs/common';
import { Email } from '@shared/kernel/email.vo';
import { EntityConflict, InvalidArgument } from '@core/exceptions/domain.exception';
import { Role } from '@core/decorators/roles.decorator';
import { User } from '../../domain/entities/user.entity';
import { HashedPassword } from '../../domain/value-objects/hashed-password.vo';
import { RawPassword } from '../../domain/value-objects/raw-password.vo';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../ports/password-hasher.port';

export interface RegisterUserInput {
  email: string;
  fullName: string;
  password: string;
  roles?: Role[];
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const emailRes = Email.create(input.email);
    if (emailRes.isFailure) throw new InvalidArgument(emailRes.getError(), { field: 'email' });
    const email = emailRes.getValue();

    const passwordRes = RawPassword.create(input.password);
    if (passwordRes.isFailure)
      throw new InvalidArgument(passwordRes.getError(), { field: 'password' });

    if (await this.users.existsByEmail(email)) {
      throw new EntityConflict('Email is already registered', { email: email.value });
    }

    const hash = await this.hasher.hash(passwordRes.getValue().value);
    const user = User.create({
      email,
      fullName: input.fullName,
      password: HashedPassword.fromHash(hash),
      roles: input.roles,
    });

    await this.users.save(user);
    return user;
  }
}
