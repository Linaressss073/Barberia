import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceDoc, ServiceSchema } from './infrastructure/persistence/service.schema';
import { MongoServiceRepository } from './infrastructure/persistence/typeorm-service.repository';
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
  imports: [MongooseModule.forFeature([{ name: ServiceDoc.name, schema: ServiceSchema }])],
  controllers: [ServicesController],
  providers: [
    { provide: SERVICE_REPOSITORY, useClass: MongoServiceRepository },
    CreateServiceUseCase,
    UpdateServiceUseCase,
    GetServiceUseCase,
    ListServicesUseCase,
    AddPromotionUseCase,
  ],
  exports: [SERVICE_REPOSITORY, MongooseModule],
})
export class ServicesModule {}
