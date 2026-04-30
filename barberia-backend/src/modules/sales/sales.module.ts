import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SaleDoc, SaleSchema } from './infrastructure/persistence/sale.schema';
import { ServiceDoc, ServiceSchema } from '@modules/services/infrastructure/persistence/service.schema';
import { InventoryProductDoc, InventoryProductSchema } from '@modules/inventory/infrastructure/persistence/inventory-product.schema';
import { CustomerDoc, CustomerSchema } from '@modules/customers/infrastructure/persistence/customer.schema';
import { MembershipDoc, MembershipSchema } from '@modules/memberships/infrastructure/persistence/membership.schema';
import { BarberDoc, BarberSchema } from '@modules/barbers/infrastructure/persistence/barber.schema';
import { AppointmentDoc, AppointmentSchema } from '@modules/appointments/infrastructure/persistence/appointment.schema';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { SalesUseCases } from './application/sale-use-cases';
import { SalesController } from './presentation/sales.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SaleDoc.name, schema: SaleSchema },
      { name: ServiceDoc.name, schema: ServiceSchema },
      { name: InventoryProductDoc.name, schema: InventoryProductSchema },
      { name: CustomerDoc.name, schema: CustomerSchema },
      { name: MembershipDoc.name, schema: MembershipSchema },
      { name: BarberDoc.name, schema: BarberSchema },
      { name: AppointmentDoc.name, schema: AppointmentSchema },
    ]),
    InventoryModule,
  ],
  controllers: [SalesController],
  providers: [SalesUseCases],
  exports: [MongooseModule],
})
export class SalesModule {}
