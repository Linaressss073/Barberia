import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Email } from '@shared/kernel/email.vo';
import { EntityConflict, InvalidArgument } from '@core/exceptions/domain.exception';
import { Role } from '@core/decorators/roles.decorator';
import { User } from '../../domain/entities/user.entity';
import { HashedPassword } from '../../domain/value-objects/hashed-password.vo';
import { RawPassword } from '../../domain/value-objects/raw-password.vo';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../ports/password-hasher.port';
import { CustomerDoc, CustomerDocument } from '@modules/customers/infrastructure/persistence/customer.schema';
import { TenantDoc, TenantDocument, TenantPlan, PLAN_LIMITS } from '@modules/tenants/infrastructure/persistence/tenant.schema';

export interface RegisterUserInput {
  email: string;
  fullName: string;
  password: string;
  roles?: Role[];
  businessName?: string;
  plan?: TenantPlan;
  tenantId?: string;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @InjectModel(CustomerDoc.name) private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(TenantDoc.name) private readonly tenantModel: Model<TenantDocument>,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const emailRes = Email.create(input.email);
    if (emailRes.isFailure) throw new InvalidArgument(emailRes.getError(), { field: 'email' });
    const email = emailRes.getValue();

    const passwordRes = RawPassword.create(input.password);
    if (passwordRes.isFailure)
      throw new InvalidArgument(passwordRes.getError(), { field: 'password' });

    if (await this.users.existsByEmail(email)) {
      throw new EntityConflict('Email is already registered', { email: email.value });
    }

    const hash = await this.hasher.hash(passwordRes.getValue().value);

    // Owner registration: businessName present → create tenant + ADMIN
    const isOwnerRegistration = !!input.businessName;
    let resolvedTenantId: string | null = null;
    let resolvedRoles: Role[];

    if (isOwnerRegistration) {
      const plan: TenantPlan = input.plan ?? 'TRIAL';
      const name = input.businessName!.trim();
      const slug = await this.uniqueSlug(name);
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const tenantId = uuidv4();

      await this.tenantModel.create({
        _id: tenantId,
        name,
        slug,
        plan,
        trialEndsAt,
        maxBarbers: PLAN_LIMITS[plan].maxBarbers,
        active: true,
      });

      resolvedTenantId = tenantId;
      resolvedRoles = [Role.Admin];
    } else {
      resolvedRoles = input.roles && input.roles.length > 0 ? input.roles : [Role.Customer];
      if (!input.tenantId) {
        throw new InvalidArgument('Debes indicar en qué barbería deseas registrarte.', {
          field: 'tenantId',
        });
      }
      const tenant = await this.tenantModel.findOne({
        _id: input.tenantId,
        active: true,
      });
      if (!tenant) {
        throw new InvalidArgument('La barbería seleccionada no existe o no está disponible.', {
          field: 'tenantId',
        });
      }
      resolvedTenantId = input.tenantId;
    }

    const user = User.create({
      email,
      fullName: input.fullName,
      password: HashedPassword.fromHash(hash),
      roles: resolvedRoles,
      tenantId: resolvedTenantId,
    });

    await this.users.save(user);

    if (resolvedRoles.includes(Role.Customer)) {
      try {
        await this.customerModel.create({
          _id: uuidv4(),
          userId: user.id.value,
          fullName: input.fullName,
          phone: null,
          birthdate: null,
          loyaltyPoints: 0,
          preferences: {},
          deletedAt: null,
          tenantId: resolvedTenantId,
        });
      } catch {
        // Customer creation is best-effort — user account already saved
      }
    }

    return user;
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'barberia';

    let slug = base;
    let attempt = 0;
    while (await this.tenantModel.exists({ slug })) {
      attempt++;
      slug = `${base}-${attempt}`;
    }
    return slug;
  }
}
