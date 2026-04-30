import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { CustomerListFilter, CustomerRepository } from '../../domain/repositories/customer.repository';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerDoc, CustomerDocument } from './customer.schema';
import { CustomerMapper } from './customer.mapper';

@Injectable()
export class MongoCustomerRepository implements CustomerRepository {
  constructor(@InjectModel(CustomerDoc.name) private readonly model: Model<CustomerDocument>) {}

  async findById(id: UniqueEntityId): Promise<Customer | null> {
    const doc = await this.model.findOne({ _id: id.value, deletedAt: null });
    return doc ? CustomerMapper.toDomain(doc) : null;
  }

  async findByDocument(document: string): Promise<Customer | null> {
    const doc = await this.model.findOne({ document, deletedAt: null });
    return doc ? CustomerMapper.toDomain(doc) : null;
  }

  async findByUserId(userId: UniqueEntityId): Promise<Customer | null> {
    const doc = await this.model.findOne({ userId: userId.value, deletedAt: null });
    return doc ? CustomerMapper.toDomain(doc) : null;
  }

  async save(customer: Customer): Promise<void> {
    const data = CustomerMapper.toDoc(customer);
    await this.model.findOneAndUpdate({ _id: data._id }, { $set: data }, { upsert: true });
  }

  async paginate(filter: CustomerListFilter): Promise<{ items: Customer[]; total: number }> {
    const query: Record<string, unknown> = { deletedAt: null };
    if (filter.search) {
      query['$or'] = [
        { fullName: { $regex: filter.search, $options: 'i' } },
        { document: { $regex: filter.search, $options: 'i' } },
        { phone: { $regex: filter.search, $options: 'i' } },
      ];
    }
    const skip = (filter.page - 1) * filter.limit;
    const [docs, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip(skip).limit(filter.limit),
      this.model.countDocuments(query),
    ]);
    return { items: docs.map(CustomerMapper.toDomain), total };
  }

  async softDelete(id: UniqueEntityId): Promise<void> {
    await this.model.findOneAndUpdate({ _id: id.value }, { $set: { deletedAt: new Date() } });
  }
}
