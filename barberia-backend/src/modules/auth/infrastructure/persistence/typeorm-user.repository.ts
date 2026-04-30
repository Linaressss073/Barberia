import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Email } from '@shared/kernel/email.vo';
import { UserListFilter, UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserDoc, UserDocument } from './user.schema';
import { UserMapper } from './user.mapper';

@Injectable()
export class MongoUserRepository implements UserRepository {
  constructor(@InjectModel(UserDoc.name) private readonly model: Model<UserDocument>) {}

  async findById(id: UniqueEntityId): Promise<User | null> {
    const doc = await this.model.findOne({ _id: id.value, deletedAt: null });
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const doc = await this.model.findOne({ email: email.value, deletedAt: null });
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.model.countDocuments({ email: email.value, deletedAt: null });
    return count > 0;
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toDoc(user);
    await this.model.findOneAndUpdate({ _id: data._id }, { $set: data }, { upsert: true });
  }

  async paginate(filter: UserListFilter): Promise<{ items: User[]; total: number }> {
    const query: Record<string, unknown> = { deletedAt: null };
    if (filter.status) query['status'] = filter.status;
    if (filter.role) query['roles'] = filter.role;
    if (filter.search) {
      query['$or'] = [
        { email: { $regex: filter.search, $options: 'i' } },
        { fullName: { $regex: filter.search, $options: 'i' } },
      ];
    }
    const skip = (filter.page - 1) * filter.limit;
    const [docs, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip(skip).limit(filter.limit),
      this.model.countDocuments(query),
    ]);
    return { items: docs.map(UserMapper.toDomain), total };
  }
}
