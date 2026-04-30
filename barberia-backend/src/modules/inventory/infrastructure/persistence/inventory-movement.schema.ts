import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MovementType = 'IN' | 'OUT' | 'ADJUST';
export type InventoryMovementDocument = HydratedDocument<InventoryMovementDoc>;

@Schema({ collection: 'inventory_movements', timestamps: false, versionKey: false })
export class InventoryMovementDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true, index: true })
  productId!: string;

  @Prop({ type: String, required: true })
  type!: MovementType;

  @Prop({ type: Number, required: true })
  qty!: number;

  @Prop({ type: String, default: null })
  reason!: string | null;

  @Prop({ type: String, default: null })
  refType!: string | null;

  @Prop({ type: String, default: null })
  refId!: string | null;

  @Prop({ type: String, default: null })
  createdBy!: string | null;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const InventoryMovementSchema = SchemaFactory.createForClass(InventoryMovementDoc);
InventoryMovementSchema.index({ productId: 1, createdAt: 1 });
