import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { BarberListFilter, BarberRepository } from '../../domain/repositories/barber.repository';
import { Barber } from '../../domain/entities/barber.entity';
import { BarberDoc, BarberDocument } from './barber.schema';
import { BarberBlockDoc, BarberBlockDocument } from './barber-block.schema';
import { BarberMapper } from './barber.mapper';

@Injectable()
export class MongoBarberRepository implements BarberRepository {
  constructor(
    @InjectModel(BarberDoc.name) private readonly model: Model<BarberDocument>,
    @InjectModel(BarberBlockDoc.name) private readonly blocks: Model<BarberBlockDocument>,
  ) {}

  async findById(id: UniqueEntityId): Promise<Barber | null> {
    const doc = await this.model.findOne({ _id: id.value });
    return doc ? BarberMapper.toDomain(doc) : null;
  }

  async findByUserId(userId: UniqueEntityId): Promise<Barber | null> {
    const doc = await this.model.findOne({ userId: userId.value });
    return doc ? BarberMapper.toDomain(doc) : null;
  }

  async save(barber: Barber): Promise<void> {
    const data = BarberMapper.toDoc(barber);
    await this.model.findOneAndUpdate({ _id: data._id }, { $set: data }, { upsert: true });
  }

  async paginate(filter: BarberListFilter): Promise<{ items: Barber[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (filter.onlyActive) query['active'] = true;
    if (filter.search) {
      query['$or'] = [
        { displayName: { $regex: filter.search, $options: 'i' } },
        { specialty: { $regex: filter.search, $options: 'i' } },
      ];
    }
    const skip = (filter.page - 1) * filter.limit;
    const [docs, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip(skip).limit(filter.limit),
      this.model.countDocuments(query),
    ]);
    return { items: docs.map(BarberMapper.toDomain), total };
  }

  async hasBlockOverlap(barberId: UniqueEntityId, startsAt: Date, endsAt: Date): Promise<boolean> {
    const count = await this.blocks.countDocuments({
      barberId: barberId.value,
      startsAt: { $lt: endsAt },
      endsAt: { $gt: startsAt },
    });
    return count > 0;
  }

  async addBlock(
    barberId: UniqueEntityId,
    startsAt: Date,
    endsAt: Date,
    reason?: string,
  ): Promise<void> {
    await this.blocks.create({
      _id: uuidv4(),
      barberId: barberId.value,
      startsAt,
      endsAt,
      reason: reason ?? null,
    });
  }
}
