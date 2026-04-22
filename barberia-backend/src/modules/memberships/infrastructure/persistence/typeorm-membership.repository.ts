import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { MembershipRepository } from '../../domain/membership.repository';
import { Membership } from '../../domain/membership';
import { MembershipOrmEntity } from './membership.orm-entity';

function toDomain(o: MembershipOrmEntity): Membership {
  return Membership.rehydrate(
    {
      customerId: new UniqueEntityId(o.customerId),
      plan: o.plan,
      startsAt: o.startsAt,
      endsAt: o.endsAt,
      discountPct: parseFloat(o.discountPct),
      active: o.active,
      createdAt: o.createdAt,
    },
    new UniqueEntityId(o.id),
  );
}

function toOrm(m: Membership): MembershipOrmEntity {
  const o = new MembershipOrmEntity();
  o.id = m.id.value;
  o.customerId = m.customerId.value;
  o.plan = m.plan;
  o.startsAt = m.startsAt;
  o.endsAt = m.endsAt;
  o.discountPct = m.discountPct.toFixed(2);
  o.active = m.active;
  o.createdAt = m.createdAt;
  return o;
}

@Injectable()
export class TypeOrmMembershipRepository implements MembershipRepository {
  constructor(
    @InjectRepository(MembershipOrmEntity) private readonly repo: Repository<MembershipOrmEntity>,
  ) {}

  async findById(id: UniqueEntityId): Promise<Membership | null> {
    const r = await this.repo.findOne({ where: { id: id.value } });
    return r ? toDomain(r) : null;
  }

  async findActiveForCustomer(customerId: UniqueEntityId, at: Date): Promise<Membership | null> {
    const r = await this.repo
      .createQueryBuilder('m')
      .where('m.customer_id = :id AND m.active = true', { id: customerId.value })
      .andWhere('m.starts_at <= :at AND m.ends_at > :at', { at })
      .orderBy('m.discount_pct', 'DESC')
      .getOne();
    return r ? toDomain(r) : null;
  }

  async listByCustomer(customerId: UniqueEntityId): Promise<Membership[]> {
    const rows = await this.repo.find({
      where: { customerId: customerId.value },
      order: { createdAt: 'DESC' },
    });
    return rows.map(toDomain);
  }

  async save(m: Membership): Promise<void> {
    await this.repo.save(toOrm(m));
  }
}
