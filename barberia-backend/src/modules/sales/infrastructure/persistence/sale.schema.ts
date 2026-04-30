import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SaleStatus = 'OPEN' | 'CLOSED' | 'VOIDED';
export type SaleItemKind = 'SERVICE' | 'PRODUCT';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'YAPE' | 'PLIN' | 'OTHER';

@Schema({ _id: false, versionKey: false })
export class SaleItemSubdoc {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({ type: String, required: true })
  kind!: SaleItemKind;

  @Prop({ type: String, default: null })
  serviceId!: string | null;

  @Prop({ type: String, default: null })
  productId!: string | null;

  @Prop({ type: Number, required: true })
  qty!: number;

  @Prop({ type: Number, required: true })
  unitPriceCents!: number;

  @Prop({ type: Number, required: true })
  totalCents!: number;
}

@Schema({ _id: false, versionKey: false })
export class PaymentSubdoc {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({ type: String, required: true })
  method!: PaymentMethod;

  @Prop({ type: Number, required: true })
  amountCents!: number;

  @Prop({ type: String, default: null })
  reference!: string | null;

  @Prop({ type: Date, default: Date.now })
  paidAt!: Date;
}

export type SaleDocument = HydratedDocument<SaleDoc>;

@Schema({ collection: 'sales', timestamps: true, versionKey: false })
export class SaleDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, default: null })
  customerId!: string | null;

  @Prop({ type: String, default: null })
  barberId!: string | null;

  @Prop({ type: String, default: null, sparse: true, unique: true })
  appointmentId!: string | null;

  @Prop({ type: Number, default: 0 })
  subtotalCents!: number;

  @Prop({ type: Number, default: 0 })
  discountCents!: number;

  @Prop({ type: Number, default: 0 })
  taxCents!: number;

  @Prop({ type: Number, default: 0 })
  totalCents!: number;

  @Prop({ type: String, default: 'OPEN' })
  status!: SaleStatus;

  @Prop({ type: Date, default: null })
  closedAt!: Date | null;

  @Prop({ type: String, default: null })
  closedBy!: string | null;

  @Prop({ type: String, default: null })
  createdBy!: string | null;

  @Prop({ type: [SaleItemSubdoc], default: [] })
  items!: SaleItemSubdoc[];

  @Prop({ type: [PaymentSubdoc], default: [] })
  payments!: PaymentSubdoc[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const SaleSchema = SchemaFactory.createForClass(SaleDoc);
SaleSchema.index({ status: 1, createdAt: 1 });
