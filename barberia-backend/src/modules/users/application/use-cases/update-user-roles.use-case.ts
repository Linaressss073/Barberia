import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Email } from '@shared/kernel/email.vo';
import { EntityNotFound, InvalidArgument } from '@core/exceptions/domain.exception';
import { Role } from '@core/decorators/roles.decorator';
import { requestContext } from '@core/context/request-context';
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

@Injectable()
export class LookupUserByEmailUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(rawEmail: string): Promise<{ id: string; email: string; fullName: string; roles: string[]; status: string } | null> {
    const emailRes = Email.create(rawEmail);
    if (emailRes.isFailure) throw new InvalidArgument('Invalid email');
    const user = await this.users.findByEmail(emailRes.getValue());
    if (!user) return null;
    return {
      id: user.id.value,
      email: user.email.value,
      fullName: user.fullName,
      roles: user.roles,
      status: user.status,
    };
  }
}

/** Asigna roles de staff a un usuario existente y lo vincula al tenant del admin. */
@Injectable()
export class AssignStaffUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(userId: string, roles: Role[]): Promise<void> {
    const tenantId = requestContext.get()?.tenantId ?? null;
    if (!tenantId) throw new InvalidArgument('No tenant context');
    const user = await this.users.findById(new UniqueEntityId(userId));
    if (!user) throw new EntityNotFound('User not found');
    user.assignRoles(roles);
    user.setTenant(tenantId);
    await this.users.save(user);
  }
}
