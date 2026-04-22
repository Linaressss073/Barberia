import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import {
  BusinessRuleViolation,
  EntityConflict,
  EntityNotFound,
  InvalidArgument,
} from '@core/exceptions/domain.exception';
import { BARBER_REPOSITORY, BarberRepository } from '../../domain/repositories/barber.repository';
import { Barber, BarberScheduleSlot } from '../../domain/entities/barber.entity';
import { Page, buildPage } from '@shared/pagination/pagination.dto';

@Injectable()
export class CreateBarberUseCase {
  constructor(@Inject(BARBER_REPOSITORY) private readonly repo: BarberRepository) {}

  async execute(input: {
    userId: string;
    displayName: string;
    specialty?: string;
    commissionPct: number;
    schedules?: BarberScheduleSlot[];
  }): Promise<Barber> {
    const userId = new UniqueEntityId(input.userId);
    if (await this.repo.findByUserId(userId)) {
      throw new EntityConflict('Barber profile already exists for this user');
    }
    const barber = Barber.create({
      userId,
      displayName: input.displayName,
      specialty: input.specialty,
      commissionPct: input.commissionPct,
      schedules: input.schedules,
    });
    await this.repo.save(barber);
    return barber;
  }
}

@Injectable()
export class UpdateBarberUseCase {
  constructor(@Inject(BARBER_REPOSITORY) private readonly repo: BarberRepository) {}

  async execute(
    id: string,
    patch: { displayName?: string; specialty?: string; commissionPct?: number; active?: boolean },
  ): Promise<Barber> {
    const b = await this.repo.findById(new UniqueEntityId(id));
    if (!b) throw new EntityNotFound('Barber not found');
    b.updateProfile(patch);
    await this.repo.save(b);
    return b;
  }
}

@Injectable()
export class SetBarberSchedulesUseCase {
  constructor(@Inject(BARBER_REPOSITORY) private readonly repo: BarberRepository) {}

  async execute(id: string, slots: BarberScheduleSlot[]): Promise<Barber> {
    const b = await this.repo.findById(new UniqueEntityId(id));
    if (!b) throw new EntityNotFound('Barber not found');
    b.setSchedules(slots);
    await this.repo.save(b);
    return b;
  }
}

@Injectable()
export class BlockBarberTimeUseCase {
  constructor(@Inject(BARBER_REPOSITORY) private readonly repo: BarberRepository) {}

  async execute(id: string, startsAt: Date, endsAt: Date, reason?: string): Promise<void> {
    if (endsAt <= startsAt) throw new InvalidArgument('endsAt must be after startsAt');
    const barberId = new UniqueEntityId(id);
    const b = await this.repo.findById(barberId);
    if (!b) throw new EntityNotFound('Barber not found');
    if (await this.repo.hasBlockOverlap(barberId, startsAt, endsAt)) {
      throw new BusinessRuleViolation('Block overlaps with existing block');
    }
    await this.repo.addBlock(barberId, startsAt, endsAt, reason);
  }
}

@Injectable()
export class ListBarbersUseCase {
  constructor(@Inject(BARBER_REPOSITORY) private readonly repo: BarberRepository) {}

  async execute(input: {
    page: number;
    limit: number;
    search?: string;
    onlyActive?: boolean;
  }): Promise<Page<Barber>> {
    const { items, total } = await this.repo.paginate(input);
    return buildPage(items, total, input.page, input.limit);
  }
}

@Injectable()
export class GetBarberUseCase {
  constructor(@Inject(BARBER_REPOSITORY) private readonly repo: BarberRepository) {}

  async execute(id: string): Promise<Barber> {
    const b = await this.repo.findById(new UniqueEntityId(id));
    if (!b) throw new EntityNotFound('Barber not found');
    return b;
  }
}
