import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false, versionKey: false })
export class BarberScheduleSubdoc {
  @Prop({ type: Number, required: true })
  weekday!: number;

  @Prop({ type: String, required: true })
  startTime!: string;

  @Prop({ type: String, required: true })
  endTime!: string;
}

export type BarberDocument = HydratedDocument<BarberDoc>;

@Schema({ collection: 'barbers', timestamps: true, versionKey: false })
export class BarberDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true })
  userId!: string;

  @Prop({ type: String, required: true })
  displayName!: string;

  @Prop({ type: String, default: null })
  specialty!: string | null;

  @Prop({ type: Date, required: true })
  hireDate!: Date;

  @Prop({ type: String, default: '0.00' })
  commissionPct!: string;

  @Prop({ type: Boolean, default: true })
  active!: boolean;

  @Prop({ type: String, default: '0.00' })
  ratingAvg!: string;

  @Prop({ type: [BarberScheduleSubdoc], default: [] })
  schedules!: BarberScheduleSubdoc[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const BarberSchema = SchemaFactory.createForClass(BarberDoc);
