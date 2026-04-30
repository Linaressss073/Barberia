import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CustomerDocument = HydratedDocument<CustomerDoc>;

@Schema({ collection: 'customers', timestamps: true, versionKey: false })
export class CustomerDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, default: null, sparse: true, unique: true })
  userId!: string | null;

  @Prop({ type: String, default: null, sparse: true, unique: true })
  document!: string | null;

  @Prop({ type: String, required: true, index: true })
  fullName!: string;

  @Prop({ type: String, default: null })
  phone!: string | null;

  @Prop({ type: Date, default: null })
  birthdate!: Date | null;

  @Prop({ type: Number, default: 0 })
  loyaltyPoints!: number;

  @Prop({ type: Object, default: {} })
  preferences!: Record<string, unknown>;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(CustomerDoc);
