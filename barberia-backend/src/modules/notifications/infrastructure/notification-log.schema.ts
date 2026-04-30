import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type Channel = 'EMAIL' | 'WHATSAPP' | 'SMS';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';
export type NotificationLogDocument = HydratedDocument<NotificationLogDoc>;

@Schema({ collection: 'notification_logs', timestamps: false, versionKey: false })
export class NotificationLogDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true })
  channel!: Channel;

  @Prop({ type: String, required: true })
  recipient!: string;

  @Prop({ type: String, required: true })
  template!: string;

  @Prop({ type: Object, default: {} })
  payload!: Record<string, unknown>;

  @Prop({ type: String, default: 'PENDING' })
  status!: NotificationStatus;

  @Prop({ type: String, default: null })
  error!: string | null;

  @Prop({ type: Date, default: null })
  sentAt!: Date | null;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt!: Date;
}

export const NotificationLogSchema = SchemaFactory.createForClass(NotificationLogDoc);
NotificationLogSchema.index({ status: 1, createdAt: 1 });
