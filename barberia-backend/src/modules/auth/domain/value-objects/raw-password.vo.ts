import { ValueObject } from '@core/domain/value-object';
import { Result } from '@core/domain/result';

interface RawPasswordProps {
  value: string;
}

/**
 * Política mínima para evitar credenciales débiles.
 * Para PROD se puede acoplar a una blacklist (haveibeenpwned, p.ej.).
 */
export class RawPassword extends ValueObject<RawPasswordProps> {
  private constructor(props: RawPasswordProps) {
    super(props);
  }

  static create(raw: string): Result<RawPassword> {
    if (!raw || raw.length < 8) return Result.fail('Password must be at least 8 chars');
    if (raw.length > 128) return Result.fail('Password is too long');
    if (!/[A-Z]/.test(raw)) return Result.fail('Password must contain an uppercase letter');
    if (!/[a-z]/.test(raw)) return Result.fail('Password must contain a lowercase letter');
    if (!/[0-9]/.test(raw)) return Result.fail('Password must contain a digit');
    return Result.ok(new RawPassword({ value: raw }));
  }

  get value(): string {
    return this.props.value;
  }
}
