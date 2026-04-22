import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, Roles } from '@core/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { SettingsService } from '../application/settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  @Get()
  @Roles(Role.Admin)
  list() {
    return this.svc.getAll();
  }

  @Get(':key')
  @Roles(Role.Admin, Role.Receptionist)
  get(@Param('key') key: string) {
    return this.svc.getOne(key);
  }

  @Put(':key')
  @Roles(Role.Admin)
  upsert(@Param('key') key: string, @Body() body: { value: unknown }) {
    return this.svc.upsert(key, body.value);
  }
}
