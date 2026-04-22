import { ValueObject } from '@core/domain/value-object';
import { InvalidArgument } from '@core/exceptions/domain.exception';
import { Result } from '@core/domain/result';

interface EmailProps {
  value: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(raw: string): Result<Email> {
    const normalized = (raw ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(normalized) || normalized.length > 254) {
      return Result.fail('Email format is invalid');
    }
    return Result.ok(new Email({ value: normalized }));
  }

  static createOrThrow(raw: string): Email {
    const r = Email.create(raw);
    if (r.isFailure) {
      throw new InvalidArgument(r.getError(), { field: 'email', value: raw });
    }
    return r.getValue();
  }
}
