import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { Role, Roles } from '@core/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '@core/decorators/current-user.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { PaginationQueryDto } from '@shared/pagination/pagination.dto';
import { BookAppointmentDto, CancelAppointmentDto } from '../application/dto/appointment.dto';
import { BookAppointmentUseCase } from '../application/book-appointment.use-case';
import { CancelAppointmentUseCase } from '../application/cancel-appointment.use-case';
import { TransitionAppointmentUseCase } from '../application/transition-appointment.use-case';
import { ListAppointmentsUseCase } from '../application/list-appointments.use-case';
import { GetAvailabilityUseCase } from '../application/availability.use-case';
import { CustomerDoc, CustomerDocument } from '@modules/customers/infrastructure/persistence/customer.schema';
import { BarberDoc, BarberDocument } from '@modules/barbers/infrastructure/persistence/barber.schema';

class ListAppointmentsQuery extends PaginationQueryDto {
  @IsOptional() @IsUUID() barberId?: string;
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsDateString() @Type(() => String) from?: string;
  @IsOptional() @IsDateString() @Type(() => String) to?: string;
}

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly bookUC: BookAppointmentUseCase,
    private readonly cancelUC: CancelAppointmentUseCase,
    private readonly transitionUC: TransitionAppointmentUseCase,
    private readonly listUC: ListAppointmentsUseCase,
    private readonly availabilityUC: GetAvailabilityUseCase,
    @InjectModel(CustomerDoc.name) private readonly customers: Model<CustomerDocument>,
    @InjectModel(BarberDoc.name) private readonly barbers: Model<BarberDocument>,
  ) {}

  @Get('availability')
  @Roles(Role.Admin, Role.Receptionist, Role.Barber, Role.Customer)
  availability(
    @Query('barberId', ParseUUIDPipe) barberId: string,
    @Query('date') dateISO: string,
    @Query('durationMin', ParseIntPipe) durationMin: number,
  ) {
    return this.availabilityUC.execute({ barberId, date: new Date(dateISO), durationMin });
  }

  @Get()
  @Roles(Role.Admin, Role.Receptionist, Role.Barber, Role.Customer)
  async list(@Query() q: ListAppointmentsQuery, @CurrentUser() user: AuthenticatedUser) {
    const isAdmin = user.roles.some((r) =>
      [Role.Admin, Role.Receptionist].includes(r as Role),
    );

    let barberId = q.barberId;
    let customerId = q.customerId;

    if (!isAdmin) {
      if (user.roles.includes(Role.Barber)) {
        const barber = await this.barbers.findOne({ userId: user.sub });
        barberId = barber?._id ?? undefined;
      } else {
        // Customer: scope to their own profile
        const customer = await this.customers.findOne({ userId: user.sub, deletedAt: null });
        customerId = customer?._id ?? 'none'; // 'none' returns empty if no profile yet
      }
    }

    return this.listUC.execute({
      page: q.page,
      limit: q.limit,
      barberId,
      customerId,
      status: q.status,
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
    });
  }

  @Post()
  @Roles(Role.Admin, Role.Receptionist, Role.Customer)
  @HttpCode(HttpStatus.CREATED)
  book(@Body() dto: BookAppointmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.bookUC.execute({
      customerId: dto.customerId,
      barberId: dto.barberId,
      scheduledAt: dto.scheduledAt,
      serviceIds: dto.serviceIds,
      source: dto.source ?? 'WEB',
      notes: dto.notes,
    });
  }

  @Patch(':id/confirm')
  @Roles(Role.Admin, Role.Receptionist, Role.Barber)
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.transitionUC.execute(id, 'CONFIRMED');
  }

  @Patch(':id/complete')
  @Roles(Role.Admin, Role.Receptionist, Role.Barber)
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.transitionUC.execute(id, 'COMPLETED');
  }

  @Patch(':id/no-show')
  @Roles(Role.Admin, Role.Receptionist)
  noShow(@Param('id', ParseUUIDPipe) id: string) {
    return this.transitionUC.execute(id, 'NO_SHOW');
  }

  @Patch(':id/cancel')
  @Roles(Role.Admin, Role.Receptionist, Role.Customer, Role.Barber)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const force = user.roles.some((r) =>
      [Role.Admin, Role.Receptionist].includes(r as Role),
    );
    await this.cancelUC.execute({ id, reason: dto.reason, force });
  }
}
