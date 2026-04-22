import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

/**
 * AuditInterceptor: registra mutaciones HTTP (POST/PUT/PATCH/DELETE).
 * Diseñado para no bloquear: si AuditService falla, hace logging local sin romper la request.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const handler = `${context.getClass().name}.${context.getHandler().name}`;
    const entity = this.deriveEntity(req.path);

    return next.handle().pipe(
      tap((response: unknown) => {
        const entityId =
          (response as { id?: string } | null)?.id ??
          (response as { data?: { id?: string } } | null)?.data?.id ??
          (req.params?.id as string | undefined);

        void this.audit.record({
          action: `${method}:${handler}`,
          entity,
          entityId,
          after: response,
        });
      }),
    );
  }

  private deriveEntity(path: string): string {
    const parts = path.split('/').filter(Boolean);
    const apiIdx = parts.findIndex((p) => /^v\d+$/.test(p));
    const resource = apiIdx >= 0 ? parts[apiIdx + 1] : parts[0];
    return (resource ?? 'unknown').slice(0, 64);
  }
}
