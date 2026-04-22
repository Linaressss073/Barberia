import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { EntityNotFound } from '@core/exceptions/domain.exception';
import { Role } from '@core/decorators/roles.decorator';
import { USER_REPOSITORY, UserRepository } from '@modules/auth/domain/repositories/user.repository';

@Injectable()
export class UpdateUserRolesUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(userId: string, roles: Role[]): Promise<void> {
    const user = await this.users.findById(new UniqueEntityId(userId));
    if (!user) throw new EntityNotFound('User not found');
    user.assignRoles(roles);
    await this.users.save(user);
  }
}
