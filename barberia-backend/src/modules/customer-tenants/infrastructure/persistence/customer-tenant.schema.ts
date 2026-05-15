import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CustomerTenantDocument = HydratedDocument<CustomerTenantDoc>;

@Schema({ collection: 'customer_tenants', timestamps: true, versionKey: false })
export class CustomerTenantDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true, index: true })
  customerId!: string;

  @Prop({ type: String, required: true, index: true })
  tenantId!: string;

  @Prop({ type: Boolean, default: false })
  isActive!: boolean;

  @Prop({ type: Boolean, default: false })
  isFavorite!: boolean;

  @Prop({ type: Number, default: 0 })
  loyaltyPoints!: number;

  @Prop({ type: Number, default: 0 })
  visitCount!: number;

  @Prop({ type: Date, default: null })
  lastVisitedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const CustomerTenantSchema = SchemaFactory.createForClass(CustomerTenantDoc);

// One record per (customer, tenant) pair
CustomerTenantSchema.index({ customerId: 1, tenantId: 1 }, { unique: true });
// Fast lookup of the active barbershop for a customer
CustomerTenantSchema.index({ customerId: 1, isActive: 1 });
