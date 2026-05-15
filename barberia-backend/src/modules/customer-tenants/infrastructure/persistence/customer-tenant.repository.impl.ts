import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomerTenantRepository } from '../../domain/repositories/customer-tenant.repository';
import { CustomerTenant } from '../../domain/entities/customer-tenant.entity';
import { CustomerTenantDoc, CustomerTenantDocument } from './customer-tenant.schema';
import { CustomerTenantMapper } from './customer-tenant.mapper';

@Injectable()
export class MongoCustomerTenantRepository implements CustomerTenantRepository {
  constructor(
    @InjectModel(CustomerTenantDoc.name) private readonly model: Model<CustomerTenantDocument>,
  ) {}

  async findByCustomerAndTenant(customerId: string, tenantId: string): Promise<CustomerTenant | null> {
    const doc = await this.model.findOne({ customerId, tenantId });
    return doc ? CustomerTenantMapper.toDomain(doc) : null;
  }

  async findActiveByCustomer(customerId: string): Promise<CustomerTenant | null> {
    const doc = await this.model.findOne({ customerId, isActive: true });
    return doc ? CustomerTenantMapper.toDomain(doc) : null;
  }

  async findAllByCustomer(customerId: string): Promise<CustomerTenant[]> {
    const docs = await this.model
      .find({ customerId })
      .sort({ lastVisitedAt: -1, createdAt: -1 });
    return docs.map(CustomerTenantMapper.toDomain);
  }

  async deactivateAllForCustomer(customerId: string): Promise<void> {
    await this.model.updateMany({ customerId, isActive: true }, { $set: { isActive: false } });
  }

  async save(record: CustomerTenant): Promise<void> {
    const data = CustomerTenantMapper.toDoc(record);
    await this.model.findOneAndUpdate(
      { _id: data._id },
      { $set: data },
      { upsert: true },
    );
  }
}
