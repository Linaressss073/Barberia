import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { EntityNotFound } from '@core/exceptions/domain.exception';
import { CustomerTenantDoc, CustomerTenantDocument } from '@modules/customer-tenants/infrastructure/persistence/customer-tenant.schema';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @InjectModel(CustomerTenantDoc.name) private readonly ctModel: Model<CustomerTenantDocument>,
  ) {}

  async execute(userId: string) {
    const user = await this.users.findById(new UniqueEntityId(userId));
    if (!user) throw new EntityNotFound('User not found');

    let activeTenantId: string | null = user.tenantId;
    if (!user.tenantId) {
      const active = await this.ctModel.findOne({ customerId: userId, isActive: true }).lean();
      activeTenantId = active ? (active.tenantId as string) : null;
    }

    return {
      id: user.id.value,
      email: user.email.value,
      fullName: user.fullName,
      roles: user.roles,
      tenantId: user.tenantId,
      activeTenantId,
    };
  }
}
