import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceOrmEntity } from './infrastructure/persistence/service.orm-entity';
import { ServicePromotionOrmEntity } from './infrastructure/persistence/service-promotion.orm-entity';
import { TypeOrmServiceRepository } from './infrastructure/persistence/typeorm-service.repository';
import { SERVICE_REPOSITORY } from './domain/repositories/service.repository';
import {
  AddPromotionUseCase,
  CreateServiceUseCase,
  GetServiceUseCase,
  ListServicesUseCase,
  UpdateServiceUseCase,
} from './application/use-cases/service-use-cases';
import { ServicesController } from './presentation/controllers/services.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceOrmEntity, ServicePromotionOrmEntity])],
  controllers: [ServicesController],
  providers: [
    { provide: SERVICE_REPOSITORY, useClass: TypeOrmServiceRepository },
    CreateServiceUseCase,
    UpdateServiceUseCase,
    GetServiceUseCase,
    ListServicesUseCase,
    AddPromotionUseCase,
  ],
  exports: [SERVICE_REPOSITORY],
})
export class ServicesModule {}
