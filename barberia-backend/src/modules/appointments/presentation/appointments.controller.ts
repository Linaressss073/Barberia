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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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

class ListAppointmentsQuery extends PaginationQueryDto {
  barberId?: string;
  customerId?: string;
  status?: string;
  @Type(() => Date) from?: Date;
  @Type(() => Date) to?: Date;
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
  list(@Query() q: ListAppointmentsQuery) {
    return this.listUC.execute(q);
  }

  @Post()
  @Roles(Role.Admin, Role.Receptionist, Role.Customer)
  @HttpCode(HttpStatus.CREATED)
  book(@Body() dto: BookAppointmentDto) {
    return this.bookUC.execute(dto);
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
    const force = user.roles.includes(Role.Admin) || user.roles.includes(Role.Receptionist);
    await this.cancelUC.execute({ id, reason: dto.reason, force });
  }
}
