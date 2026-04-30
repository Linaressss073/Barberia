import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Email } from '@shared/kernel/email.vo';
import { Role } from '@core/decorators/roles.decorator';
import { User, UserStatus } from '../../domain/entities/user.entity';
import { HashedPassword } from '../../domain/value-objects/hashed-password.vo';
import { UserDocument } from './user.schema';

export class UserMapper {
  static toDomain(doc: UserDocument): User {
    return User.rehydrate(
      {
        email: Email.createOrThrow(doc.email),
        fullName: doc.fullName,
        password: HashedPassword.fromHash(doc.passwordHash),
        status: doc.status as UserStatus,
        roles: doc.roles as Role[],
        lastLoginAt: doc.lastLoginAt ?? undefined,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      new UniqueEntityId(doc._id),
    );
  }

  static toDoc(domain: User): Record<string, unknown> {
    return {
      _id: domain.id.value,
      email: domain.email.value,
      fullName: domain.fullName,
      passwordHash: domain.password.value,
      status: domain.status,
      roles: domain.roles,
      lastLoginAt: domain.lastLoginAt ?? null,
      deletedAt: null,
    };
  }
}
