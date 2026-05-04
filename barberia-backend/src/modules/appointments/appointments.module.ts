import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentDoc, AppointmentSchema } from './infrastructure/persistence/appointment.schema';
import { CustomerDoc, CustomerSchema } from '@modules/customers/infrastructure/persistence/customer.schema';
import { BarberDoc, BarberSchema } from '@modules/barbers/infrastructure/persistence/barber.schema';
import { BarberBlockDoc, BarberBlockSchema } from '@modules/barbers/infrastructure/persistence/barber-block.schema';
import { ServiceDoc, ServiceSchema } from '@modules/services/infrastructure/persistence/service.schema';
import { UserDoc, UserSchema } from '@modules/auth/infrastructure/persistence/user.schema';
import { BookAppointmentUseCase } from './application/book-appointment.use-case';
import { CancelAppointmentUseCase } from './application/cancel-appointment.use-case';
import { TransitionAppointmentUseCase } from './application/transition-appointment.use-case';
import { ListAppointmentsUseCase } from './application/list-appointments.use-case';
import { GetAvailabilityUseCase } from './application/availability.use-case';
import { RateAppointmentUseCase } from './application/rate-appointment.use-case';
import { AppointmentsController } from './presentation/appointments.controller';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppointmentDoc.name, schema: AppointmentSchema },
      { name: CustomerDoc.name, schema: CustomerSchema },
      { name: BarberDoc.name, schema: BarberSchema },
      { name: BarberBlockDoc.name, schema: BarberBlockSchema },
      { name: ServiceDoc.name, schema: ServiceSchema },
      { name: UserDoc.name, schema: UserSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [AppointmentsController],
  providers: [
    BookAppointmentUseCase,
    CancelAppointmentUseCase,
    TransitionAppointmentUseCase,
    ListAppointmentsUseCase,
    GetAvailabilityUseCase,
    RateAppointmentUseCase,
  ],
  exports: [MongooseModule],
})
export class AppointmentsModule {}
