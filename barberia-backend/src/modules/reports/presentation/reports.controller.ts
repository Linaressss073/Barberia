import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, Roles } from '@core/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { ReportsService } from '../application/reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get('sales/daily')
  dailySales(@Query('from') from: string, @Query('to') to: string) {
    return this.svc.dailySales(new Date(from), new Date(to));
  }

  @Get('services/top')
  topServices(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.topServices(new Date(from), new Date(to), limit ? parseInt(limit, 10) : 10);
  }

  @Get('barbers/occupancy')
  occupancy(@Query('from') from: string, @Query('to') to: string) {
    return this.svc.occupancyByBarber(new Date(from), new Date(to));
  }

  @Get('barbers/commissions')
  commissions(@Query('from') from: string, @Query('to') to: string) {
    return this.svc.commissionsByBarber(new Date(from), new Date(to));
  }

  @Get('customers/top')
  topCustomers(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.topCustomers(new Date(from), new Date(to), limit ? parseInt(limit, 10) : 10);
  }
}
