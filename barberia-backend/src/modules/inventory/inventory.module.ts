import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  InventoryProductDoc,
  InventoryProductSchema,
} from './infrastructure/persistence/inventory-product.schema';
import {
  InventoryMovementDoc,
  InventoryMovementSchema,
} from './infrastructure/persistence/inventory-movement.schema';
import { InventoryDomainService } from './domain/inventory.service';
import { InventoryUseCases } from './application/inventory-use-cases';
import { InventoryController } from './presentation/inventory.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryProductDoc.name, schema: InventoryProductSchema },
      { name: InventoryMovementDoc.name, schema: InventoryMovementSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryDomainService, InventoryUseCases],
  exports: [InventoryDomainService, MongooseModule],
})
export class InventoryModule {}
