import { ValueObject } from '@core/domain/value-object';
import { Result } from '@core/domain/result';

interface PhoneProps {
  value: string;
}

/**
 * Validación liviana E.164-like. Para producción se puede sustituir por libphonenumber-js.
 */
export class Phone extends ValueObject<PhoneProps> {
  private constructor(props: PhoneProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(raw: string): Result<Phone> {
    const cleaned = (raw ?? '').replace(/[\s-]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(cleaned)) {
      return Result.fail('Phone format is invalid (use E.164)');
    }
    return Result.ok(new Phone({ value: cleaned }));
  }
}
