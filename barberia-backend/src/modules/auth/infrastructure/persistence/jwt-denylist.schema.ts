import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type JwtDenylistDocument = HydratedDocument<JwtDenylistDoc>;

@Schema({ collection: 'jwt_denylist', timestamps: false, versionKey: false })
export class JwtDenylistDoc {
  @Prop({ type: String, required: true })
  _id!: string; // jti

  @Prop({ type: Date, required: true, index: true })
  expiresAt!: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const JwtDenylistSchema = SchemaFactory.createForClass(JwtDenylistDoc);
