import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { EntityNotFound } from '@core/exceptions/domain.exception';
import { USER_REPOSITORY, UserRepository } from '@modules/auth/domain/repositories/user.repository';

@Injectable()
export class SetUserStatusUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(userId: string, enabled: boolean): Promise<void> {
    const user = await this.users.findById(new UniqueEntityId(userId));
    if (!user) throw new EntityNotFound('User not found');
    if (enabled) user.enable();
    else user.disable();
    await this.users.save(user);
  }
}
