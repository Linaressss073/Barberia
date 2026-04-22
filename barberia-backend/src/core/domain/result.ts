/**
 * Result<T, E>: representación funcional de éxito/fracaso.
 * Evita lanzar excepciones desde el dominio para errores de negocio
 * esperables. Excepciones quedan reservadas para fallas técnicas.
 */
export class Result<T, E = string> {
  private constructor(
    public readonly isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {
    Object.freeze(this);
  }

  get isFailure(): boolean {
    return !this.isSuccess;
  }

  getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get value from a failed Result');
    }
    return this._value as T;
  }

  getError(): E {
    if (this.isSuccess) {
      throw new Error('Cannot get error from a successful Result');
    }
    return this._error as E;
  }

  static ok<U, E = string>(value?: U): Result<U, E> {
    return new Result<U, E>(true, value);
  }

  static fail<U, E = string>(error: E): Result<U, E> {
    return new Result<U, E>(false, undefined, error);
  }
}
