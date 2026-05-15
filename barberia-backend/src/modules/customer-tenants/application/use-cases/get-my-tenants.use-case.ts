import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InvalidArgument } from '@core/exceptions/domain.exception';
import { requestContext } from '@core/context/request-context';
import { CUSTOMER_TENANT_REPOSITORY, CustomerTenantRepository } from '../../domain/repositories/customer-tenant.repository';
import { TenantDoc, TenantDocument } from '@modules/tenants/infrastructure/persistence/tenant.schema';

export interface CustomerTenantSummary {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  isActive: boolean;
  isFavorite: boolean;
  loyaltyPoints: number;
  visitCount: number;
  lastVisitedAt: Date | null;
}

@Injectable()
export class GetMyTenantsUseCase {
  constructor(
    @Inject(CUSTOMER_TENANT_REPOSITORY) private readonly repo: CustomerTenantRepository,
    @InjectModel(TenantDoc.name) private readonly tenantModel: Model<TenantDocument>,
  ) {}

  async execute(): Promise<CustomerTenantSummary[]> {
    const userId = requestContext.get()?.userId;
    if (!userId) throw new InvalidArgument('No user context');

    const records = await this.repo.findAllByCustomer(userId);
    if (records.length === 0) return [];

    const tenantIds = records.map(r => r.tenantId);
    const tenants = await this.tenantModel.find({ _id: { $in: tenantIds } }).lean();
    const tenantMap = new Map(tenants.map(t => [t._id as string, t]));

    return records.map(r => {
      const t = tenantMap.get(r.tenantId);
      return {
        id: r.id.value,
        tenantId: r.tenantId,
        tenantName: t?.name ?? r.tenantId,
        tenantSlug: t?.slug ?? '',
        isActive: r.isActive,
        isFavorite: r.isFavorite,
        loyaltyPoints: r.loyaltyPoints,
        visitCount: r.visitCount,
        lastVisitedAt: r.lastVisitedAt,
      };
    });
  }
}
