import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleOrmEntity } from './infrastructure/persistence/sale.orm-entity';
import { SaleItemOrmEntity } from './infrastructure/persistence/sale-item.orm-entity';
import { PaymentOrmEntity } from './infrastructure/persistence/payment.orm-entity';
import { ServiceOrmEntity } from '@modules/services/infrastructure/persistence/service.orm-entity';
import { InventoryProductOrmEntity } from '@modules/inventory/infrastructure/persistence/inventory-product.orm-entity';
import { CustomerOrmEntity } from '@modules/customers/infrastructure/persistence/customer.orm-entity';
import { MembershipOrmEntity } from '@modules/memberships/infrastructure/persistence/membership.orm-entity';
import { BarberOrmEntity } from '@modules/barbers/infrastructure/persistence/barber.orm-entity';
import { AppointmentOrmEntity } from '@modules/appointments/infrastructure/persistence/appointment.orm-entity';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { SalesUseCases } from './application/sale-use-cases';
import { SalesController } from './presentation/sales.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SaleOrmEntity,
      SaleItemOrmEntity,
      PaymentOrmEntity,
      ServiceOrmEntity,
      InventoryProductOrmEntity,
      CustomerOrmEntity,
      MembershipOrmEntity,
      BarberOrmEntity,
      AppointmentOrmEntity,
    ]),
    InventoryModule,
  ],
  controllers: [SalesController],
  providers: [SalesUseCases],
  exports: [TypeOrmModule],
})
export class SalesModule {}
