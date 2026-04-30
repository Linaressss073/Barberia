import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { ServiceListFilter, ServiceRepository } from '../../domain/repositories/service.repository';
import { Service } from '../../domain/entities/service.entity';
import { ServiceDoc, ServiceDocument } from './service.schema';
import { ServiceMapper } from './service.mapper';

@Injectable()
export class MongoServiceRepository implements ServiceRepository {
  constructor(@InjectModel(ServiceDoc.name) private readonly model: Model<ServiceDocument>) {}

  async findById(id: UniqueEntityId): Promise<Service | null> {
    const doc = await this.model.findOne({ _id: id.value, deletedAt: null });
    return doc ? ServiceMapper.toDomain(doc) : null;
  }

  async findManyByIds(ids: UniqueEntityId[]): Promise<Service[]> {
    if (ids.length === 0) return [];
    const docs = await this.model.find({
      _id: { $in: ids.map((i) => i.value) },
      deletedAt: null,
    });
    return docs.map(ServiceMapper.toDomain);
  }

  async save(svc: Service): Promise<void> {
    const data = ServiceMapper.toDoc(svc);
    await this.model.findOneAndUpdate({ _id: data._id }, { $set: data }, { upsert: true });
  }

  async paginate(filter: ServiceListFilter): Promise<{ items: Service[]; total: number }> {
    const query: Record<string, unknown> = { deletedAt: null };
    if (filter.search) query['name'] = { $regex: filter.search, $options: 'i' };
    if (filter.onlyActive) query['active'] = true;
    const skip = (filter.page - 1) * filter.limit;
    const [docs, total] = await Promise.all([
      this.model.find(query).sort({ name: 1 }).skip(skip).limit(filter.limit),
      this.model.countDocuments(query),
    ]);
    return { items: docs.map(ServiceMapper.toDomain), total };
  }

  async softDelete(id: UniqueEntityId): Promise<void> {
    await this.model.findOneAndUpdate({ _id: id.value }, { $set: { deletedAt: new Date() } });
  }
}
