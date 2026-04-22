import { ValueObject } from '@core/domain/value-object';
import { Result } from '@core/domain/result';

interface MoneyProps {
  amountCents: number;
  currency: string;
}

/**
 * Money en centavos enteros para evitar errores de coma flotante.
 * Toda operación monetaria del dominio debe pasar por aquí.
 */
export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  static create(amountCents: number, currency = 'PEN'): Result<Money> {
    if (!Number.isInteger(amountCents)) {
      return Result.fail('Amount must be an integer number of cents');
    }
    if (amountCents < 0) {
      return Result.fail('Amount cannot be negative');
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      return Result.fail('Currency must be ISO-4217');
    }
    return Result.ok(new Money({ amountCents, currency }));
  }

  static zero(currency = 'PEN'): Money {
    return new Money({ amountCents: 0, currency });
  }

  get amountCents(): number {
    return this.props.amountCents;
  }
  get currency(): string {
    return this.props.currency;
  }
  get amount(): number {
    return this.props.amountCents / 100;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money({
      amountCents: this.amountCents + other.amountCents,
      currency: this.currency,
    });
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.amountCents - other.amountCents;
    if (result < 0) throw new Error('Money cannot be negative');
    return new Money({ amountCents: result, currency: this.currency });
  }

  applyDiscountPct(pct: number): Money {
    if (pct < 0 || pct > 100) throw new Error('Discount pct must be in [0,100]');
    const discounted = Math.round(this.amountCents * (1 - pct / 100));
    return new Money({ amountCents: discounted, currency: this.currency });
  }

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
