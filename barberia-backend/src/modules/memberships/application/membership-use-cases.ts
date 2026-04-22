import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { EntityNotFound } from '@core/exceptions/domain.exception';
import { MEMBERSHIP_REPOSITORY, MembershipRepository } from '../domain/membership.repository';
import { Membership } from '../domain/membership';

@Injectable()
export class SubscribeMembershipUseCase {
  constructor(@Inject(MEMBERSHIP_REPOSITORY) private readonly repo: MembershipRepository) {}

  async execute(input: {
    customerId: string;
    plan: string;
    startsAt: Date;
    endsAt: Date;
    discountPct: number;
  }): Promise<Membership> {
    const m = Membership.create({
      customerId: new UniqueEntityId(input.customerId),
      plan: input.plan,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      discountPct: input.discountPct,
    });
    await this.repo.save(m);
    return m;
  }
}

@Injectable()
export class CancelMembershipUseCase {
  constructor(@Inject(MEMBERSHIP_REPOSITORY) private readonly repo: MembershipRepository) {}

  async execute(id: string): Promise<void> {
    const m = await this.repo.findById(new UniqueEntityId(id));
    if (!m) throw new EntityNotFound('Membership not found');
    m.cancel();
    await this.repo.save(m);
  }
}

@Injectable()
export class ListMembershipsByCustomerUseCase {
  constructor(@Inject(MEMBERSHIP_REPOSITORY) private readonly repo: MembershipRepository) {}

  execute(customerId: string): Promise<Membership[]> {
    return this.repo.listByCustomer(new UniqueEntityId(customerId));
  }
}
