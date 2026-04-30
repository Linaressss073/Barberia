import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BarberDoc, BarberSchema } from './infrastructure/persistence/barber.schema';
import { BarberBlockDoc, BarberBlockSchema } from './infrastructure/persistence/barber-block.schema';
import { MongoBarberRepository } from './infrastructure/persistence/typeorm-barber.repository';
import { BARBER_REPOSITORY } from './domain/repositories/barber.repository';
import {
  BlockBarberTimeUseCase,
  CreateBarberUseCase,
  GetBarberUseCase,
  ListBarbersUseCase,
  SetBarberSchedulesUseCase,
  UpdateBarberUseCase,
} from './application/use-cases/barber-use-cases';
import { BarbersController } from './presentation/controllers/barbers.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BarberDoc.name, schema: BarberSchema },
      { name: BarberBlockDoc.name, schema: BarberBlockSchema },
    ]),
  ],
  controllers: [BarbersController],
  providers: [
    { provide: BARBER_REPOSITORY, useClass: MongoBarberRepository },
    CreateBarberUseCase,
    UpdateBarberUseCase,
    SetBarberSchedulesUseCase,
    BlockBarberTimeUseCase,
    ListBarbersUseCase,
    GetBarberUseCase,
  ],
  exports: [BARBER_REPOSITORY, MongooseModule],
})
export class BarbersModule {}
