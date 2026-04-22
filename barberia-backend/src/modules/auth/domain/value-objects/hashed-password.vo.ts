import { ValueObject } from '@core/domain/value-object';

interface HashedPasswordProps {
  hash: string;
}

/**
 * El dominio recibe el hash YA computado por un PasswordHasher (puerto).
 * Nunca conoce bcrypt o argon2 directamente.
 */
export class HashedPassword extends ValueObject<HashedPasswordProps> {
  private constructor(props: HashedPasswordProps) {
    super(props);
  }

  static fromHash(hash: string): HashedPassword {
    if (!hash || hash.length < 20) {
      throw new Error('Invalid password hash');
    }
    return new HashedPassword({ hash });
  }

  get value(): string {
    return this.props.hash;
  }
}
