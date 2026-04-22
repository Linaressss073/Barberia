import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { EntityNotFound } from '@core/exceptions/domain.exception';
import {
  SERVICE_REPOSITORY,
  ServiceRepository,
} from '../../domain/repositories/service.repository';
import { Service } from '../../domain/entities/service.entity';
import { Page, buildPage } from '@shared/pagination/pagination.dto';

@Injectable()
export class CreateServiceUseCase {
  constructor(@Inject(SERVICE_REPOSITORY) private readonly repo: ServiceRepository) {}

  async execute(input: {
    name: string;
    description?: string;
    durationMin: number;
    priceCents: number;
  }): Promise<Service> {
    const svc = Service.create(input);
    await this.repo.save(svc);
    return svc;
  }
}

@Injectable()
export class UpdateServiceUseCase {
  constructor(@Inject(SERVICE_REPOSITORY) private readonly repo: ServiceRepository) {}

  async execute(
    id: string,
    patch: {
      name?: string;
      description?: string;
      durationMin?: number;
      priceCents?: number;
      active?: boolean;
    },
  ): Promise<Service> {
    const s = await this.repo.findById(new UniqueEntityId(id));
    if (!s) throw new EntityNotFound('Service not found');
    s.update(patch);
    await this.repo.save(s);
    return s;
  }
}

@Injectable()
export class GetServiceUseCase {
  constructor(@Inject(SERVICE_REPOSITORY) private readonly repo: ServiceRepository) {}

  async execute(id: string): Promise<Service> {
    const s = await this.repo.findById(new UniqueEntityId(id));
    if (!s) throw new EntityNotFound('Service not found');
    return s;
  }
}

@Injectable()
export class ListServicesUseCase {
  constructor(@Inject(SERVICE_REPOSITORY) private readonly repo: ServiceRepository) {}

  async execute(input: {
    page: number;
    limit: number;
    search?: string;
    onlyActive?: boolean;
  }): Promise<Page<Service>> {
    const { items, total } = await this.repo.paginate(input);
    return buildPage(items, total, input.page, input.limit);
  }
}

@Injectable()
export class AddPromotionUseCase {
  constructor(@Inject(SERVICE_REPOSITORY) private readonly repo: ServiceRepository) {}

  async execute(
    serviceId: string,
    p: { name: string; discountPct: number; validFrom: Date; validTo: Date },
  ): Promise<Service> {
    const s = await this.repo.findById(new UniqueEntityId(serviceId));
    if (!s) throw new EntityNotFound('Service not found');
    s.addPromotion(p);
    await this.repo.save(s);
    return s;
  }
}
