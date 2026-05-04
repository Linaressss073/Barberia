import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { requestContext } from '@core/context/request-context';
import { MembershipRepository } from '../../domain/membership.repository';
import { Membership } from '../../domain/membership';
import { MembershipDoc, MembershipDocument } from './membership.schema';

function toDomain(doc: MembershipDocument): Membership {
  return Membership.rehydrate(
    {
      customerId: new UniqueEntityId(doc.customerId),
      plan: doc.plan,
      startsAt: doc.startsAt,
      endsAt: doc.endsAt,
      discountPct: parseFloat(doc.discountPct),
      active: doc.active,
      createdAt: doc.createdAt,
    },
    new UniqueEntityId(doc._id),
  );
}

@Injectable()
export class MongoMembershipRepository implements MembershipRepository {
  constructor(@InjectModel(MembershipDoc.name) private readonly model: Model<MembershipDocument>) {}

  private get tenantId(): string | null {
    return requestContext.get()?.tenantId ?? null;
  }

  async findById(id: UniqueEntityId): Promise<Membership | null> {
    const q: Record<string, unknown> = { _id: id.value };
    if (this.tenantId) q['tenantId'] = this.tenantId;
    const doc = await this.model.findOne(q);
    return doc ? toDomain(doc) : null;
  }

  async findActiveForCustomer(customerId: UniqueEntityId, at: Date): Promise<Membership | null> {
    const base: Record<string, unknown> = {
      customerId: customerId.value,
      active: true,
      startsAt: { $lte: at },
      endsAt: { $gt: at },
    };
    if (this.tenantId) base['tenantId'] = this.tenantId;
    const doc = await this.model.findOne(base).sort({ discountPct: -1 });
    return doc ? toDomain(doc) : null;
  }

  async listByCustomer(customerId: UniqueEntityId): Promise<Membership[]> {
    const q: Record<string, unknown> = { customerId: customerId.value };
    if (this.tenantId) q['tenantId'] = this.tenantId;
    const docs = await this.model.find(q).sort({ createdAt: -1 });
    return docs.map(toDomain);
  }

  async save(m: Membership): Promise<void> {
    await this.model.findOneAndUpdate(
      { _id: m.id.value },
      {
        $set: {
          _id: m.id.value,
          customerId: m.customerId.value,
          plan: m.plan,
          startsAt: m.startsAt,
          endsAt: m.endsAt,
          discountPct: m.discountPct.toFixed(2),
          active: m.active,
          createdAt: m.createdAt,
          tenantId: this.tenantId,
        },
      },
      { upsert: true },
    );
  }
}
