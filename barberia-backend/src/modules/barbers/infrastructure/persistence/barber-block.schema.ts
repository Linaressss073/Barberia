import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BarberBlockDocument = HydratedDocument<BarberBlockDoc>;

@Schema({ collection: 'barber_blocks', timestamps: false, versionKey: false })
export class BarberBlockDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true, index: true })
  barberId!: string;

  @Prop({ type: Date, required: true })
  startsAt!: Date;

  @Prop({ type: Date, required: true })
  endsAt!: Date;

  @Prop({ type: String, default: null })
  reason!: string | null;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const BarberBlockSchema = SchemaFactory.createForClass(BarberBlockDoc);
BarberBlockSchema.index({ barberId: 1, startsAt: 1 });
