import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentOrmEntity } from './infrastructure/persistence/appointment.orm-entity';
import { AppointmentItemOrmEntity } from './infrastructure/persistence/appointment-item.orm-entity';
import { CustomerOrmEntity } from '@modules/customers/infrastructure/persistence/customer.orm-entity';
import { BarberOrmEntity } from '@modules/barbers/infrastructure/persistence/barber.orm-entity';
import { BarberBlockOrmEntity } from '@modules/barbers/infrastructure/persistence/barber-block.orm-entity';
import { ServiceOrmEntity } from '@modules/services/infrastructure/persistence/service.orm-entity';
import { BookAppointmentUseCase } from './application/book-appointment.use-case';
import { CancelAppointmentUseCase } from './application/cancel-appointment.use-case';
import { TransitionAppointmentUseCase } from './application/transition-appointment.use-case';
import { ListAppointmentsUseCase } from './application/list-appointments.use-case';
import { GetAvailabilityUseCase } from './application/availability.use-case';
import { AppointmentsController } from './presentation/appointments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppointmentOrmEntity,
      AppointmentItemOrmEntity,
      CustomerOrmEntity,
      BarberOrmEntity,
      BarberBlockOrmEntity,
      ServiceOrmEntity,
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [
    BookAppointmentUseCase,
    CancelAppointmentUseCase,
    TransitionAppointmentUseCase,
    ListAppointmentsUseCase,
    GetAvailabilityUseCase,
  ],
  exports: [TypeOrmModule],
})
export class AppointmentsModule {}
