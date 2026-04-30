import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<UserDoc>;

@Schema({ collection: 'users', timestamps: true, versionKey: false })
export class UserDoc {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true })
  email!: string;

  @Prop({ type: String, required: true })
  fullName!: string;

  @Prop({ type: String, required: true })
  passwordHash!: string;

  @Prop({ type: String, default: 'ACTIVE' })
  status!: string;

  @Prop({ type: [String], default: [] })
  roles!: string[];

  @Prop({ type: Date, default: null })
  lastLoginAt!: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserDoc);
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
