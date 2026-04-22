import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { requestContext } from '@core/context/request-context';
import { AuditLogOrmEntity } from '../infrastructure/persistence/audit-log.orm-entity';

export interface AuditEntry {
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repo: Repository<AuditLogOrmEntity>,
  ) {}

  async record(entry: AuditEntry): Promise<void> {
    const ctx = requestContext.get();
    try {
      const log = new AuditLogOrmEntity();
      log.userId = ctx?.userId ?? null;
      log.action = entry.action.slice(0, 64);
      log.entity = entry.entity.slice(0, 64);
      log.entityId = entry.entityId ?? null;
      log.before = this.normalize(entry.before);
      log.after = this.normalize(entry.after);
      log.ip = ctx?.ip ?? null;
      log.userAgent = ctx?.userAgent ?? null;
      log.requestId = ctx?.requestId ?? null;
      await this.repo.save(log);
    } catch (err) {
      this.logger.error('Failed to write audit log', err as Error);
    }
  }

  private normalize(value: unknown): Record<string, unknown> | null {
    if (value == null) return null;
    if (typeof value === 'object') return value as Record<string, unknown>;
    return { value };
  }
}
