import { AggregateRoot } from '@core/domain/aggregate-root';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Email } from '@shared/kernel/email.vo';
import { Role } from '@core/decorators/roles.decorator';
import { HashedPassword } from '../value-objects/hashed-password.vo';
import { BusinessRuleViolation } from '@core/exceptions/domain.exception';

export enum UserStatus {
  Active = 'ACTIVE',
  Disabled = 'DISABLED',
  Pending = 'PENDING',
}

interface UserProps {
  email: Email;
  fullName: string;
  password: HashedPassword;
  status: UserStatus;
  roles: Role[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate Root del bounded context de identidad/auth.
 * Encapsula invariantes: estado válido, roles no vacíos, etc.
 */
export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(
    params: {
      email: Email;
      fullName: string;
      password: HashedPassword;
      roles?: Role[];
      status?: UserStatus;
    },
    id?: UniqueEntityId,
  ): User {
    const now = new Date();
    const roles = params.roles && params.roles.length > 0 ? params.roles : [Role.Customer];
    return new User(
      {
        email: params.email,
        fullName: params.fullName.trim(),
        password: params.password,
        status: params.status ?? UserStatus.Active,
        roles,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  static rehydrate(props: UserProps, id: UniqueEntityId): User {
    return new User(props, id);
  }

  get email(): Email {
    return this.props.email;
  }
  get fullName(): string {
    return this.props.fullName;
  }
  get password(): HashedPassword {
    return this.props.password;
  }
  get status(): UserStatus {
    return this.props.status;
  }
  get roles(): Role[] {
    return [...this.props.roles];
  }
  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isActive(): boolean {
    return this.props.status === UserStatus.Active;
  }

  ensureCanLogin(): void {
    if (this.props.status === UserStatus.Disabled) {
      throw new BusinessRuleViolation('User is disabled');
    }
    if (this.props.status === UserStatus.Pending) {
      throw new BusinessRuleViolation('User must verify email before logging in');
    }
  }

  recordLogin(): void {
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();
  }

  changePassword(newHash: HashedPassword): void {
    this.props.password = newHash;
    this.props.updatedAt = new Date();
  }

  assignRoles(roles: Role[]): void {
    if (roles.length === 0) {
      throw new BusinessRuleViolation('User must have at least one role');
    }
    this.props.roles = [...new Set(roles)];
    this.props.updatedAt = new Date();
  }

  enable(): void {
    this.props.status = UserStatus.Active;
    this.props.updatedAt = new Date();
  }

  disable(): void {
    this.props.status = UserStatus.Disabled;
    this.props.updatedAt = new Date();
  }
}
