import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { RefreshTokenDoc, RefreshTokenDocument } from './refresh-token.schema';
import { RefreshTokenMapper } from './refresh-token.mapper';

@Injectable()
export class MongoRefreshTokenRepository implements RefreshTokenRepository {
  constructor(
    @InjectModel(RefreshTokenDoc.name) private readonly model: Model<RefreshTokenDocument>,
  ) {}

  async save(token: RefreshToken): Promise<void> {
    const data = RefreshTokenMapper.toDoc(token);
    await this.model.findOneAndUpdate({ _id: data._id }, { $set: data }, { upsert: true });
  }

  async findActiveByHash(tokenHash: string): Promise<RefreshToken | null> {
    const doc = await this.model.findOne({
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
    return doc ? RefreshTokenMapper.toDomain(doc) : null;
  }

  async revokeAllForUser(userId: UniqueEntityId): Promise<void> {
    await this.model.updateMany(
      { userId: userId.value, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }
}
