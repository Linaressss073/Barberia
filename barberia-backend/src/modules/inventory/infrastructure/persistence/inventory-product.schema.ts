import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InventoryProductDocument = HydratedDocument<InventoryProductDoc>;

@Schema({ collection: 'inventory_products', timestamps: true, versionKey: false })
export class InventoryProductDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true, unique: true })
  sku!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: Number, required: true })
  costCents!: number;

  @Prop({ type: Number, required: true })
  salePriceCents!: number;

  @Prop({ type: Number, default: 0 })
  stock!: number;

  @Prop({ type: Number, default: 0 })
  minStock!: number;

  @Prop({ type: Boolean, default: true })
  active!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const InventoryProductSchema = SchemaFactory.createForClass(InventoryProductDoc);
