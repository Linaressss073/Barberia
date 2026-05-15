import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '@modules/auth/auth.module';
import { CustomerDoc, CustomerDocument, CustomerSchema } from './infrastructure/persistence/customer.schema';
import { MongoCustomerRepository } from './infrastructure/persistence/typeorm-customer.repository';
import { CUSTOMER_REPOSITORY } from './domain/repositories/customer.repository';
import { CreateCustomerUseCase } from './application/use-cases/create-customer.use-case';
import { EnsureCustomerProfileUseCase } from './application/use-cases/ensure-customer-profile.use-case';
import { UpdateCustomerUseCase } from './application/use-cases/update-customer.use-case';
import { GetCustomerUseCase } from './application/use-cases/get-customer.use-case';
import { ListCustomersUseCase } from './application/use-cases/list-customers.use-case';
import {
  AddLoyaltyPointsUseCase,
  RedeemLoyaltyPointsUseCase,
} from './application/use-cases/loyalty.use-case';
import { CustomersController } from './presentation/controllers/customers.controller';

@Injectable()
class CustomerIndexMigration implements OnModuleInit {
  constructor(@InjectModel(CustomerDoc.name) private readonly model: Model<CustomerDocument>) {}

  async onModuleInit() {
    try { await this.model.collection.dropIndex('document_1'); } catch {}
    try { await this.model.ensureIndexes(); } catch {}
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CustomerDoc.name, schema: CustomerSchema }]),
    AuthModule,
  ],
  controllers: [CustomersController],
  providers: [
    CustomerIndexMigration,
    { provide: CUSTOMER_REPOSITORY, useClass: MongoCustomerRepository },
    CreateCustomerUseCase,
    EnsureCustomerProfileUseCase,
    UpdateCustomerUseCase,
    GetCustomerUseCase,
    ListCustomersUseCase,
    AddLoyaltyPointsUseCase,
    RedeemLoyaltyPointsUseCase,
  ],
  exports: [CUSTOMER_REPOSITORY, EnsureCustomerProfileUseCase, MongooseModule],
})
export class CustomersModule {}
