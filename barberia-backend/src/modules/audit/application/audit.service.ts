import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { requestContext } from '@core/context/request-context';
import { AuditLogDoc, AuditLogDocument } from '../infrastructure/persistence/audit-log.schema';

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
    @InjectModel(AuditLogDoc.name) private readonly model: Model<AuditLogDocument>,
  ) {}

  async record(entry: AuditEntry): Promise<void> {
    const ctx = requestContext.get();
    try {
      await this.model.create({
        _id: uuidv4(),
        userId: ctx?.userId ?? null,
        action: entry.action.slice(0, 64),
        entity: entry.entity.slice(0, 64),
        entityId: entry.entityId ?? null,
        before: this.normalize(entry.before),
        after: this.normalize(entry.after),
        ip: ctx?.ip ?? null,
        userAgent: ctx?.userAgent ?? null,
        requestId: ctx?.requestId ?? null,
      });
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
