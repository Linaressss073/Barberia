import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { requestContext } from '../context/request-context';

/**
 * Inicializa el RequestContext para cada request entrante.
 * El JwtStrategy enriquecerá userId/email/roles más adelante.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId =
      (req.headers['x-request-id'] as string | undefined)?.slice(0, 64) ?? randomUUID();
    res.setHeader('x-request-id', requestId);

    requestContext.run(
      {
        requestId,
        ip: req.ip,
        userAgent: req.headers['user-agent']?.slice(0, 256),
        startedAt: Date.now(),
      },
      () => next(),
    );
  }
}
