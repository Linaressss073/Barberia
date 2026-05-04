import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TenantDocument = HydratedDocument<TenantDoc>;

export type TenantPlan = 'TRIAL' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';

export const PLAN_LIMITS: Record<TenantPlan, { maxBarbers: number }> = {
  TRIAL:        { maxBarbers: 3 },
  BASIC:        { maxBarbers: 3 },
  PROFESSIONAL: { maxBarbers: 10 },
  ENTERPRISE:   { maxBarbers: -1 },
};

@Schema({ collection: 'tenants', timestamps: true, versionKey: false })
export class TenantDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true })
  slug!: string;

  @Prop({ type: String, default: 'TRIAL', enum: ['TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'] })
  plan!: TenantPlan;

  @Prop({ type: Date, default: null })
  trialEndsAt!: Date | null;

  @Prop({ type: Number, default: 3 })
  maxBarbers!: number;

  @Prop({ type: Boolean, default: true })
  active!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const TenantSchema = SchemaFactory.createForClass(TenantDoc);
TenantSchema.index({ slug: 1 }, { unique: true });
