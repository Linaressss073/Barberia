import { randomUUID } from 'crypto';

/**
 * Identificador único de una entidad/agregado.
 * Se mantiene como Value Object para encapsular la generación
 * y futuras validaciones (UUID v4/v7, ULID, snowflake, etc).
 */
export class UniqueEntityId {
  private readonly _value: string;

  constructor(value?: string) {
    this._value = value ?? randomUUID();
  }

  get value(): string {
    return this._value;
  }

  equals(id?: UniqueEntityId): boolean {
    if (!id) return false;
    return id._value === this._value;
  }

  toString(): string {
    return this._value;
  }
}
