import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import {
  BusinessRuleViolation,
  EntityNotFound,
  InvalidArgument,
} from '@core/exceptions/domain.exception';
import { HashedPassword } from '@modules/auth/domain/value-objects/hashed-password.vo';
import { RawPassword } from '@modules/auth/domain/value-objects/raw-password.vo';
import { USER_REPOSITORY, UserRepository } from '@modules/auth/domain/repositories/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from '@modules/auth/application/ports/password-hasher.port';
import { UpdateMeDto } from '../dto/update-me.dto';

@Injectable()
export class UpdateMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(
    userId: string,
    dto: UpdateMeDto,
  ): Promise<{ id: string; email: string; fullName: string; roles: string[]; tenantId: string | null }> {
    const user = await this.users.findById(new UniqueEntityId(userId));
    if (!user) throw new EntityNotFound('Usuario no encontrado');

    if (dto.newPassword != null && dto.newPassword.length > 0) {
      if (!dto.currentPassword) {
        throw new InvalidArgument('Debes indicar la contraseña actual', { field: 'currentPassword' });
      }
      const match = await this.hasher.compare(dto.currentPassword, user.password.value);
      if (!match) {
        throw new BusinessRuleViolation('La contraseña actual no es correcta');
      }
      const np = RawPassword.create(dto.newPassword);
      if (np.isFailure) throw new InvalidArgument(np.getError()!, { field: 'newPassword' });
      const hash = await this.hasher.hash(np.getValue().value);
      user.changePassword(HashedPassword.fromHash(hash));
    }

    if (dto.fullName != null && dto.fullName.trim().length > 0) {
      user.updateFullName(dto.fullName);
    }

    await this.users.save(user);
    return {
      id: user.id.value,
      email: user.email.value,
      fullName: user.fullName,
      roles: user.roles,
      tenantId: user.tenantId,
    };
  }
}
