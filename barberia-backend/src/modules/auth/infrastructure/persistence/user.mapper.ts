import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Email } from '@shared/kernel/email.vo';
import { Role } from '@core/decorators/roles.decorator';
import { User, UserStatus } from '../../domain/entities/user.entity';
import { HashedPassword } from '../../domain/value-objects/hashed-password.vo';
import { UserOrmEntity } from './user.orm-entity';

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    return User.rehydrate(
      {
        email: Email.createOrThrow(orm.email),
        fullName: orm.fullName,
        password: HashedPassword.fromHash(orm.passwordHash),
        status: orm.status as UserStatus,
        roles: orm.roles as Role[],
        lastLoginAt: orm.lastLoginAt ?? undefined,
        createdAt: orm.createdAt,
        updatedAt: orm.updatedAt,
      },
      new UniqueEntityId(orm.id),
    );
  }

  static toOrm(domain: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    orm.id = domain.id.value;
    orm.email = domain.email.value;
    orm.fullName = domain.fullName;
    orm.passwordHash = domain.password.value;
    orm.status = domain.status;
    orm.roles = domain.roles;
    orm.lastLoginAt = domain.lastLoginAt ?? null;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.deletedAt = null;
    return orm;
  }
}
