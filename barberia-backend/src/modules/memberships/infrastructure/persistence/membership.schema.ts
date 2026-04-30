import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MembershipDocument = HydratedDocument<MembershipDoc>;

@Schema({ collection: 'memberships', timestamps: false, versionKey: false })
export class MembershipDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true, index: true })
  customerId!: string;

  @Prop({ type: String, required: true })
  plan!: string;

  @Prop({ type: Date, required: true })
  startsAt!: Date;

  @Prop({ type: Date, required: true })
  endsAt!: Date;

  @Prop({ type: String, default: '0.00' })
  discountPct!: string;

  @Prop({ type: Boolean, default: true })
  active!: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const MembershipSchema = SchemaFactory.createForClass(MembershipDoc);
MembershipSchema.index({ customerId: 1, active: 1 });
