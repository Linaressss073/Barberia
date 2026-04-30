import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshTokenDoc>;

@Schema({ collection: 'refresh_tokens', timestamps: false, versionKey: false })
export class RefreshTokenDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true, index: true })
  userId!: string;

  @Prop({ type: String, required: true, unique: true })
  tokenHash!: string;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @Prop({ type: Date, default: null })
  revokedAt!: Date | null;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshTokenDoc);
RefreshTokenSchema.index({ userId: 1 });
