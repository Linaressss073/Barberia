/**
 * Excepción base del dominio. NO depende de NestJS.
 * Los filtros HTTP la mapean al status code adecuado.
 */
export abstract class DomainException extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BusinessRuleViolation extends DomainException {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly httpStatus = 422;
}

export class EntityNotFound extends DomainException {
  readonly code = 'ENTITY_NOT_FOUND';
  readonly httpStatus = 404;
}

export class EntityConflict extends DomainException {
  readonly code = 'ENTITY_CONFLICT';
  readonly httpStatus = 409;
}

export class InvalidArgument extends DomainException {
  readonly code = 'INVALID_ARGUMENT';
  readonly httpStatus = 400;
}

export class Unauthorized extends DomainException {
  readonly code = 'UNAUTHORIZED';
  readonly httpStatus = 401;
}

export class Forbidden extends DomainException {
  readonly code = 'FORBIDDEN';
  readonly httpStatus = 403;
}
