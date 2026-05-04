import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SettingDocument = HydratedDocument<SettingDoc>;

@Schema({ collection: 'settings', timestamps: false, versionKey: false })
export class SettingDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, index: true, default: null })
  tenantId!: string | null;

  @Prop({ type: String, required: true })
  key!: string;

  @Prop({ type: Object })
  value!: unknown;

  @Prop({ type: String, default: null })
  updatedBy!: string | null;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}

export const SettingSchema = SchemaFactory.createForClass(SettingDoc);
SettingSchema.index({ tenantId: 1, key: 1 }, { unique: true });
