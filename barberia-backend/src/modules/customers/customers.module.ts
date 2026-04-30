import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerDoc, CustomerSchema } from './infrastructure/persistence/customer.schema';
import { MongoCustomerRepository } from './infrastructure/persistence/typeorm-customer.repository';
import { CUSTOMER_REPOSITORY } from './domain/repositories/customer.repository';
import { CreateCustomerUseCase } from './application/use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from './application/use-cases/update-customer.use-case';
import { GetCustomerUseCase } from './application/use-cases/get-customer.use-case';
import { ListCustomersUseCase } from './application/use-cases/list-customers.use-case';
import {
  AddLoyaltyPointsUseCase,
  RedeemLoyaltyPointsUseCase,
} from './application/use-cases/loyalty.use-case';
import { CustomersController } from './presentation/controllers/customers.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: CustomerDoc.name, schema: CustomerSchema }])],
  controllers: [CustomersController],
  providers: [
    { provide: CUSTOMER_REPOSITORY, useClass: MongoCustomerRepository },
    CreateCustomerUseCase,
    UpdateCustomerUseCase,
    GetCustomerUseCase,
    ListCustomersUseCase,
    AddLoyaltyPointsUseCase,
    RedeemLoyaltyPointsUseCase,
  ],
  exports: [CUSTOMER_REPOSITORY, MongooseModule],
})
export class CustomersModule {}
