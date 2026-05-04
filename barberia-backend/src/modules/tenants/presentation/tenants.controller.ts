import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '@core/decorators/current-user.decorator';
import { Roles } from '@core/decorators/roles.decorator';
import { Role } from '@core/decorators/roles.decorator';
import { TenantsService } from '../application/tenants.service';
import { TenantPlan } from '../infrastructure/persistence/tenant.schema';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

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
