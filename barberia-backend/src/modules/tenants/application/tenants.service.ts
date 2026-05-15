import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { TenantDoc, TenantDocument, TenantPlan, PLAN_LIMITS } from '../infrastructure/persistence/tenant.schema';
import { ServiceDoc, ServiceDocument } from '@modules/services/infrastructure/persistence/service.schema';
import { BarberDoc, BarberDocument } from '@modules/barbers/infrastructure/persistence/barber.schema';

export interface CreateTenantInput {
  name: string;
  plan?: TenantPlan;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(TenantDoc.name) private readonly model: Model<TenantDocument>,
    @InjectModel(ServiceDoc.name) private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(BarberDoc.name) private readonly barberModel: Model<BarberDocument>,
  ) {}

  async create(input: CreateTenantInput): Promise<TenantDocument> {
    const plan: TenantPlan = input.plan ?? 'TRIAL';
    const baseSlug = slugify(input.name) || 'barberia';
    const slug = await this.uniqueSlug(baseSlug);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    return this.model.create({
      _id: uuidv4(),
      name: input.name,
      slug,
      plan,
      trialEndsAt,
      maxBarbers: PLAN_LIMITS[plan].maxBarbers,
      active: true,
    });
  }

  async findById(id: string): Promise<TenantDocument | null> {
    return this.model.findOne({ _id: id, active: true });
  }

  async findByIdOrThrow(id: string): Promise<TenantDocument> {
    const tenant = await this.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async listDiscover(): Promise<{ id: string; name: string; slug: string }[]> {
    const docs = await this.model
      .find({ active: true })
      .select('_id name slug')
      .sort({ name: 1 })
      .limit(100)
      .lean();
    return docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      slug: d.slug,
    }));
  }

  async updatePlan(id: string, plan: TenantPlan): Promise<TenantDocument> {
    const doc = await this.model.findOneAndUpdate(
      { _id: id },
      { $set: { plan, maxBarbers: PLAN_LIMITS[plan].maxBarbers } },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Tenant not found');
    return doc;
  }

  async findPublicDetail(id: string) {
    const tenant = await this.findById(id);
    if (!tenant) throw new NotFoundException('Barbería no encontrada');

    const [services, barbers] = await Promise.all([
      this.serviceModel.find({ tenantId: id, active: true, deletedAt: null }).sort({ name: 1 }).lean(),
      this.barberModel.find({ tenantId: id, active: true }).sort({ displayName: 1 }).lean(),
    ]);

    return {
      id: String(tenant._id),
      name: tenant.name,
      slug: tenant.slug,
      services: services.map(s => ({
        id: String(s._id),
        name: s.name,
        description: s.description,
        durationMin: s.durationMin,
        priceCents: s.priceCents,
      })),
      barbers: barbers.map(b => ({
        id: String(b._id),
        displayName: b.displayName,
        specialty: b.specialty,
        ratingAvg: b.ratingAvg,
      })),
    };
  }

  private async uniqueSlug(base: string): Promise<string> {
    let slug = base;
    let attempt = 0;
    while (await this.model.exists({ slug })) {
      attempt++;
      slug = `${base}-${attempt}`;
    }
    return slug;
  }
}
