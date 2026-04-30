import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AppointmentStatus = 'BOOKED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type AppointmentSource = 'WEB' | 'PHONE' | 'WALKIN' | 'ADMIN';

@Schema({ _id: false, versionKey: false })
export class AppointmentItemSubdoc {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({ type: String, required: true })
  serviceId!: string;

  @Prop({ type: Number, required: true })
  priceCents!: number;

  @Prop({ type: Number, required: true })
  durationMin!: number;
}

export type AppointmentDocument = HydratedDocument<AppointmentDoc>;

@Schema({ collection: 'appointments', timestamps: true, versionKey: false })
export class AppointmentDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true, index: true })
  customerId!: string;

  @Prop({ type: String, required: true, index: true })
  barberId!: string;

  @Prop({ type: Date, required: true })
  scheduledAt!: Date;

  @Prop({ type: Date, required: true })
  endsAt!: Date;

  @Prop({ type: String, default: 'BOOKED' })
  status!: AppointmentStatus;

  @Prop({ type: String, default: 'WEB' })
  source!: AppointmentSource;

  @Prop({ type: String, default: null })
  notes!: string | null;

  @Prop({ type: String, default: null })
  createdBy!: string | null;

  @Prop({ type: Date, default: null })
  cancelledAt!: Date | null;

  @Prop({ type: String, default: null })
  cancelReason!: string | null;

  @Prop({ type: [AppointmentItemSubdoc], default: [] })
  items!: AppointmentItemSubdoc[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(AppointmentDoc);
AppointmentSchema.index({ barberId: 1, scheduledAt: 1 });
AppointmentSchema.index({ customerId: 1, scheduledAt: 1 });
