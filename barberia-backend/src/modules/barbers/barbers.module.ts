import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarberOrmEntity } from './infrastructure/persistence/barber.orm-entity';
import { BarberScheduleOrmEntity } from './infrastructure/persistence/barber-schedule.orm-entity';
import { BarberBlockOrmEntity } from './infrastructure/persistence/barber-block.orm-entity';
import { TypeOrmBarberRepository } from './infrastructure/persistence/typeorm-barber.repository';
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
    TypeOrmModule.forFeature([BarberOrmEntity, BarberScheduleOrmEntity, BarberBlockOrmEntity]),
  ],
  controllers: [BarbersController],
  providers: [
    { provide: BARBER_REPOSITORY, useClass: TypeOrmBarberRepository },
    CreateBarberUseCase,
    UpdateBarberUseCase,
    SetBarberSchedulesUseCase,
    BlockBarberTimeUseCase,
    ListBarbersUseCase,
    GetBarberUseCase,
  ],
  exports: [BARBER_REPOSITORY],
})
export class BarbersModule {}
