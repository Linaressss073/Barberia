import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SaleDoc, SaleSchema } from '@modules/sales/infrastructure/persistence/sale.schema';
import { AppointmentDoc, AppointmentSchema } from '@modules/appointments/infrastructure/persistence/appointment.schema';
import { CustomerDoc, CustomerSchema } from '@modules/customers/infrastructure/persistence/customer.schema';
import { BarberDoc, BarberSchema } from '@modules/barbers/infrastructure/persistence/barber.schema';
import { ServiceDoc, ServiceSchema } from '@modules/services/infrastructure/persistence/service.schema';
import { ReportsService } from './application/reports.service';
import { ReportsController } from './presentation/reports.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SaleDoc.name, schema: SaleSchema },
      { name: AppointmentDoc.name, schema: AppointmentSchema },
      { name: CustomerDoc.name, schema: CustomerSchema },
      { name: BarberDoc.name, schema: BarberSchema },
      { name: ServiceDoc.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
