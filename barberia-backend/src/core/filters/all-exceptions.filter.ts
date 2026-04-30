import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoServerError } from 'mongodb';
import { DomainException } from '../exceptions/domain.exception';

interface ErrorPayload {
  statusCode: number;
  code: string;
  message: string;
  path: string;
  timestamp: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const payload = this.toPayload(exception, request.url);

    if (payload.statusCode >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} -> ${payload.statusCode} ${payload.message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} -> ${payload.statusCode} ${payload.code} ${payload.message}`,
      );
    }

    response.status(payload.statusCode).json(payload);
  }

  private toPayload(exception: unknown, path: string): ErrorPayload {
    const base = { path, timestamp: new Date().toISOString() };

    if (exception instanceof DomainException) {
      return {
        ...base,
        statusCode: exception.httpStatus,
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : ((res as Record<string, unknown>).message ?? exception.message);
      return {
        ...base,
        statusCode: exception.getStatus(),
        code: this.codeFromHttp(exception.getStatus()),
        message: Array.isArray(message) ? message.join(', ') : String(message),
        details: typeof res === 'object' ? res : undefined,
      };
    }

    if (exception instanceof MongoServerError) {
      const isUnique = exception.code === 11000;
      return {
        ...base,
        statusCode: isUnique ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST,
        code: isUnique ? 'UNIQUE_VIOLATION' : 'DB_QUERY_FAILED',
        message: isUnique ? 'Duplicate key violation' : exception.message,
      };
    }

    return {
      ...base,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    };
  }

  private codeFromHttp(status: number): string {
    return (
      {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        422: 'UNPROCESSABLE_ENTITY',
        429: 'TOO_MANY_REQUESTS',
      }[status] ?? `HTTP_${status}`
    );
  }
}
