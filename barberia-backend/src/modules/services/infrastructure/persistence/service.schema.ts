import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false, versionKey: false })
export class PromotionSubdoc {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true })
  discountPct!: string;

  @Prop({ type: Date, required: true })
  validFrom!: Date;

  @Prop({ type: Date, required: true })
  validTo!: Date;
}

export type ServiceDocument = HydratedDocument<ServiceDoc>;

@Schema({ collection: 'services', timestamps: true, versionKey: false })
export class ServiceDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, default: null })
  description!: string | null;

  @Prop({ type: Number, required: true })
  durationMin!: number;

  @Prop({ type: Number, required: true })
  priceCents!: number;

  @Prop({ type: Boolean, default: true })
  active!: boolean;

  @Prop({ type: [PromotionSubdoc], default: [] })
  promotions!: PromotionSubdoc[];

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ServiceSchema = SchemaFactory.createForClass(ServiceDoc);
