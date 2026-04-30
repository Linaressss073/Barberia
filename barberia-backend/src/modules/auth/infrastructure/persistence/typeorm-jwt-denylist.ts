import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtDenylist } from '../../application/ports/jwt-denylist.port';
import { JwtDenylistDoc, JwtDenylistDocument } from './jwt-denylist.schema';

@Injectable()
export class MongoJwtDenylist implements JwtDenylist {
  constructor(
    @InjectModel(JwtDenylistDoc.name) private readonly model: Model<JwtDenylistDocument>,
  ) {}

  async isRevoked(jti: string): Promise<boolean> {
    const count = await this.model.countDocuments({ _id: jti });
    return count > 0;
  }

  async revoke(jti: string, expiresAt: Date): Promise<void> {
    await this.model.findOneAndUpdate(
      { _id: jti },
      { $set: { _id: jti, expiresAt } },
      { upsert: true },
    );
  }

  async purgeExpired(): Promise<number> {
    const result = await this.model.deleteMany({ expiresAt: { $lt: new Date() } });
    return result.deletedCount ?? 0;
  }
}
