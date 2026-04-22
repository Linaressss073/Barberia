import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, Roles } from '@core/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { PaginationQueryDto } from '@shared/pagination/pagination.dto';
import {
  BlockTimeDto,
  CreateBarberDto,
  SetSchedulesDto,
  UpdateBarberDto,
} from '../../application/dto/barber.dto';
import {
  BlockBarberTimeUseCase,
  CreateBarberUseCase,
  GetBarberUseCase,
  ListBarbersUseCase,
  SetBarberSchedulesUseCase,
  UpdateBarberUseCase,
} from '../../application/use-cases/barber-use-cases';
import { Barber } from '../../domain/entities/barber.entity';

@ApiTags('Barbers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('barbers')
export class BarbersController {
  constructor(
    private readonly createUC: CreateBarberUseCase,
    private readonly updateUC: UpdateBarberUseCase,
    private readonly schedulesUC: SetBarberSchedulesUseCase,
    private readonly blockUC: BlockBarberTimeUseCase,
    private readonly listUC: ListBarbersUseCase,
    private readonly getUC: GetBarberUseCase,
  ) {}

  @Get()
  @Roles(Role.Admin, Role.Receptionist, Role.Barber, Role.Customer)
  async list(@Query() q: PaginationQueryDto & { onlyActive?: string }) {
    const page = await this.listUC.execute({
      page: q.page,
      limit: q.limit,
      search: q.search,
      onlyActive: q.onlyActive === 'true',
    });
    return { ...page, items: page.items.map(this.toJson) };
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Receptionist, Role.Barber, Role.Customer)
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.toJson(await this.getUC.execute(id));
  }

  @Post()
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateBarberDto) {
    return this.toJson(await this.createUC.execute(dto));
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBarberDto) {
    return this.toJson(await this.updateUC.execute(id, dto));
  }

  @Post(':id/schedules')
  @Roles(Role.Admin)
  async setSchedules(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetSchedulesDto) {
    return this.toJson(await this.schedulesUC.execute(id, dto.schedules));
  }

  @Post(':id/blocks')
  @Roles(Role.Admin, Role.Receptionist)
  @HttpCode(HttpStatus.CREATED)
  async block(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BlockTimeDto,
  ): Promise<{ ok: true }> {
    await this.blockUC.execute(id, dto.startsAt, dto.endsAt, dto.reason);
    return { ok: true };
  }

  private toJson(b: Barber) {
    return {
      id: b.id.value,
      userId: b.userId.value,
      displayName: b.displayName,
      specialty: b.specialty,
      hireDate: b.hireDate,
      commissionPct: b.commissionPct,
      active: b.active,
      ratingAvg: b.ratingAvg,
      schedules: b.schedules,
    };
  }
}
