import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLogDoc>;

@Schema({ collection: 'audit_logs', timestamps: false, versionKey: false })
export class AuditLogDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, default: null, index: true })
  userId!: string | null;

  @Prop({ type: String, required: true })
  action!: string;

  @Prop({ type: String, required: true, index: true })
  entity!: string;

  @Prop({ type: String, default: null })
  entityId!: string | null;

  @Prop({ type: Object, default: null })
  before!: Record<string, unknown> | null;

  @Prop({ type: Object, default: null })
  after!: Record<string, unknown> | null;

  @Prop({ type: String, default: null })
  ip!: string | null;

  @Prop({ type: String, default: null })
  userAgent!: string | null;

  @Prop({ type: String, default: null })
  requestId!: string | null;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt!: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLogDoc);
