import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '@core/decorators/current-user.decorator';
import { Public, Role, Roles } from '@core/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { TenantsService } from '../application/tenants.service';
import { TenantPlan } from '../infrastructure/persistence/tenant.schema';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  /** Listado público para que clientes elijan barbería (sin auth). */
  @Public()
  @Get('discover')
  discover() {
    return this.tenants.listDiscover();
  }

  /** Detalle público de una barbería: info + servicios activos + barberos activos. */
  @Public()
  @Get(':id/public')
  publicDetail(@Param('id') id: string) {
    return this.tenants.findPublicDetail(id);
  }

  @Get('me')
  @Roles(Role.Admin)
  async getMyTenant(@CurrentUser() user: AuthenticatedUser) {
    if (!user.tenantId) return null;
    return this.tenants.findByIdOrThrow(user.tenantId);
  }

  @Patch('me/plan')
  @Roles(Role.Admin)
  async updatePlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { plan: TenantPlan },
  ) {
    if (!user.tenantId) return null;
    return this.tenants.updatePlan(user.tenantId, body.plan);
  }
}
