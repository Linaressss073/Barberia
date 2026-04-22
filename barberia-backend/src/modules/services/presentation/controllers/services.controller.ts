import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
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
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import {
  AddPromotionDto,
  CreateServiceDto,
  UpdateServiceDto,
} from '../../application/dto/service.dto';
import {
  AddPromotionUseCase,
  CreateServiceUseCase,
  GetServiceUseCase,
  ListServicesUseCase,
  UpdateServiceUseCase,
} from '../../application/use-cases/service-use-cases';
import { Service } from '../../domain/entities/service.entity';
import {
  SERVICE_REPOSITORY,
  ServiceRepository,
} from '../../domain/repositories/service.repository';

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServicesController {
  constructor(
    private readonly createUC: CreateServiceUseCase,
    private readonly updateUC: UpdateServiceUseCase,
    private readonly getUC: GetServiceUseCase,
    private readonly listUC: ListServicesUseCase,
    private readonly promoUC: AddPromotionUseCase,
    @Inject(SERVICE_REPOSITORY) private readonly repo: ServiceRepository,
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
  async create(@Body() dto: CreateServiceDto) {
    return this.toJson(await this.createUC.execute(dto));
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceDto) {
    return this.toJson(await this.updateUC.execute(id, dto));
  }

  @Post(':id/promotions')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  async addPromo(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddPromotionDto) {
    return this.toJson(await this.promoUC.execute(id, dto));
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.repo.softDelete(new UniqueEntityId(id));
  }

  private toJson(s: Service) {
    return {
      id: s.id.value,
      name: s.name,
      description: s.description,
      durationMin: s.durationMin,
      priceCents: s.price.amountCents,
      effectivePriceCents: s.effectivePriceAt(new Date()).amountCents,
      active: s.active,
      promotions: s.promotions.map((p) => ({
        id: p.id?.value,
        name: p.name,
        discountPct: p.discountPct,
        validFrom: p.validFrom,
        validTo: p.validTo,
      })),
    };
  }
}
