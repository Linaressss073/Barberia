import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
  userId?: string;
  userEmail?: string;
  userRoles?: string[];
  ip?: string;
  userAgent?: string;
  startedAt: number;
}

class RequestContextStorage {
  private readonly als = new AsyncLocalStorage<RequestContext>();

  run<T>(ctx: RequestContext, fn: () => T): T {
    return this.als.run(ctx, fn);
  }

  get(): RequestContext | undefined {
    return this.als.getStore();
  }

  getOrThrow(): RequestContext {
    const ctx = this.als.getStore();
    if (!ctx) throw new Error('No active RequestContext');
    return ctx;
  }
}

export const requestContext = new RequestContextStorage();
