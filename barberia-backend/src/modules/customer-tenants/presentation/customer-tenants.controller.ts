import { Body, Controller, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { SetActiveTenantUseCase } from '../application/use-cases/set-active-tenant.use-case';
import { GetMyTenantsUseCase } from '../application/use-cases/get-my-tenants.use-case';
import { SetActiveTenantDto } from '../application/dto/set-active-tenant.dto';

@ApiTags('Customer Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customer-tenants')
export class CustomerTenantsController {
  constructor(
    private readonly setActiveUC: SetActiveTenantUseCase,
    private readonly getMyTenantsUC: GetMyTenantsUseCase,
  ) {}

  @Get('mine')
  getMyTenants() {
    return this.getMyTenantsUC.execute();
  }

  @Patch('active')
  @HttpCode(HttpStatus.OK)
  setActive(@Body() dto: SetActiveTenantDto) {
    return this.setActiveUC.execute(dto.tenantId);
  }
}
