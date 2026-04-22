import { AggregateRoot } from '@core/domain/aggregate-root';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { BusinessRuleViolation, InvalidArgument } from '@core/exceptions/domain.exception';

export interface BarberScheduleSlot {
  weekday: number; // 0 = Sunday .. 6 = Saturday
  startTime: string; // 'HH:MM'
  endTime: string;
}

interface BarberProps {
  userId: UniqueEntityId;
  displayName: string;
  specialty?: string;
  hireDate: Date;
  commissionPct: number;
  active: boolean;
  ratingAvg: number;
  schedules: BarberScheduleSlot[];
  createdAt: Date;
  updatedAt: Date;
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class Barber extends AggregateRoot<BarberProps> {
  private constructor(props: BarberProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(
    params: {
      userId: UniqueEntityId;
      displayName: string;
      specialty?: string;
      commissionPct: number;
      hireDate?: Date;
      schedules?: BarberScheduleSlot[];
    },
    id?: UniqueEntityId,
  ): Barber {
    if (params.commissionPct < 0 || params.commissionPct > 100) {
      throw new InvalidArgument('commissionPct must be 0..100');
    }
    const schedules = params.schedules ?? [];
    schedules.forEach(Barber.assertValidSlot);
    const now = new Date();
    return new Barber(
      {
        userId: params.userId,
        displayName: params.displayName.trim(),
        specialty: params.specialty?.trim() || undefined,
        hireDate: params.hireDate ?? now,
        commissionPct: params.commissionPct,
        active: true,
        ratingAvg: 0,
        schedules,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  static rehydrate(props: BarberProps, id: UniqueEntityId): Barber {
    return new Barber(props, id);
  }

  get userId(): UniqueEntityId {
    return this.props.userId;
  }
  get displayName(): string {
    return this.props.displayName;
  }
  get specialty(): string | undefined {
    return this.props.specialty;
  }
  get hireDate(): Date {
    return this.props.hireDate;
  }
  get commissionPct(): number {
    return this.props.commissionPct;
  }
  get active(): boolean {
    return this.props.active;
  }
  get ratingAvg(): number {
    return this.props.ratingAvg;
  }
  get schedules(): BarberScheduleSlot[] {
    return [...this.props.schedules];
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateProfile(
    patch: Partial<{
      displayName: string;
      specialty: string;
      commissionPct: number;
      active: boolean;
    }>,
  ): void {
    if (patch.displayName !== undefined) this.props.displayName = patch.displayName.trim();
    if (patch.specialty !== undefined) this.props.specialty = patch.specialty.trim() || undefined;
    if (patch.commissionPct !== undefined) {
      if (patch.commissionPct < 0 || patch.commissionPct > 100) {
        throw new InvalidArgument('commissionPct must be 0..100');
      }
      this.props.commissionPct = patch.commissionPct;
    }
    if (patch.active !== undefined) this.props.active = patch.active;
    this.props.updatedAt = new Date();
  }

  setSchedules(slots: BarberScheduleSlot[]): void {
    slots.forEach(Barber.assertValidSlot);
    const days = new Set<number>();
    for (const s of slots) {
      if (days.has(s.weekday)) {
        throw new BusinessRuleViolation('Duplicate schedule for the same weekday');
      }
      days.add(s.weekday);
    }
    this.props.schedules = [...slots];
    this.props.updatedAt = new Date();
  }

  recordRating(newAvg: number): void {
    if (newAvg < 0 || newAvg > 5) throw new InvalidArgument('rating must be 0..5');
    this.props.ratingAvg = Math.round(newAvg * 100) / 100;
    this.props.updatedAt = new Date();
  }

  isAvailableOn(weekday: number, time: string): boolean {
    if (!this.active) return false;
    const slot = this.props.schedules.find((s) => s.weekday === weekday);
    if (!slot) return false;
    return time >= slot.startTime && time < slot.endTime;
  }

  private static assertValidSlot(s: BarberScheduleSlot): void {
    if (s.weekday < 0 || s.weekday > 6) throw new InvalidArgument('weekday must be 0..6');
    if (!TIME_RE.test(s.startTime) || !TIME_RE.test(s.endTime)) {
      throw new InvalidArgument('time must be HH:MM');
    }
    if (s.endTime <= s.startTime) {
      throw new InvalidArgument('endTime must be after startTime');
    }
  }
}
