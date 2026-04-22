import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryProductOrmEntity } from './infrastructure/persistence/inventory-product.orm-entity';
import { InventoryMovementOrmEntity } from './infrastructure/persistence/inventory-movement.orm-entity';
import { InventoryDomainService } from './domain/inventory.service';
import { InventoryUseCases } from './application/inventory-use-cases';
import { InventoryController } from './presentation/inventory.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryProductOrmEntity, InventoryMovementOrmEntity])],
  controllers: [InventoryController],
  providers: [InventoryDomainService, InventoryUseCases],
  exports: [InventoryDomainService, TypeOrmModule],
})
export class InventoryModule {}
