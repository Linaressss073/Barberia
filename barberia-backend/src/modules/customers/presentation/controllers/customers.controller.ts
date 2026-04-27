import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, Roles } from '@core/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '@core/decorators/current-user.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { PaginationQueryDto } from '@shared/pagination/pagination.dto';
import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Customer } from '../../domain/entities/customer.entity';
import { CreateCustomerDto } from '../../application/dto/create-customer.dto';
import { UpdateCustomerDto } from '../../application/dto/update-customer.dto';
import { CreateCustomerUseCase } from '../../application/use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from '../../application/use-cases/update-customer.use-case';
import { GetCustomerUseCase } from '../../application/use-cases/get-customer.use-case';
import { ListCustomersUseCase } from '../../application/use-cases/list-customers.use-case';
import {
  AddLoyaltyPointsUseCase,
  RedeemLoyaltyPointsUseCase,
} from '../../application/use-cases/loyalty.use-case';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepository,
} from '../../domain/repositories/customer.repository';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly createUC: CreateCustomerUseCase,
    private readonly updateUC: UpdateCustomerUseCase,
    private readonly getUC: GetCustomerUseCase,
    private readonly listUC: ListCustomersUseCase,
    private readonly addPointsUC: AddLoyaltyPointsUseCase,
    private readonly redeemUC: RedeemLoyaltyPointsUseCase,
    @Inject(CUSTOMER_REPOSITORY) private readonly repo: CustomerRepository,
  ) {}

  @Get('me')
  @Roles(Role.Admin, Role.Receptionist, Role.Barber, Role.Customer)
  @ApiOperation({ summary: 'Perfil de cliente del usuario autenticado' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const customer = await this.repo.findByUserId(new UniqueEntityId(user.sub));
    return customer ? this.toJson(customer) : null;
  }

  @Get()
  @Roles(Role.Admin, Role.Receptionist, Role.Barber)
  async list(@Query() q: PaginationQueryDto) {
    const page = await this.listUC.execute(q);
    return { ...page, items: page.items.map(this.toJson) };
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Receptionist, Role.Barber)
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.toJson(await this.getUC.execute(id));
  }

  @Post()
  @Roles(Role.Admin, Role.Receptionist)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCustomerDto) {
    return this.toJson(await this.createUC.execute(dto));
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Receptionist)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerDto) {
    return this.toJson(await this.updateUC.execute({ id, ...dto }));
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.repo.softDelete(new UniqueEntityId(id));
  }

  @Post(':id/loyalty/add/:points')
  @Roles(Role.Admin, Role.Receptionist)
  async addPoints(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('points', ParseIntPipe) points: number,
  ) {
    return this.toJson(await this.addPointsUC.execute(id, points));
  }

  @Post(':id/loyalty/redeem/:points')
  @Roles(Role.Admin, Role.Receptionist)
  async redeem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('points', ParseIntPipe) points: number,
  ) {
    return this.toJson(await this.redeemUC.execute(id, points));
  }

  private toJson(c: Customer) {
    return {
      id: c.id.value,
      fullName: c.fullName,
      document: c.document,
      phone: c.phone,
      birthdate: c.birthdate,
      loyaltyPoints: c.loyaltyPoints,
      preferences: c.preferences,
      userId: c.userId?.value,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}
