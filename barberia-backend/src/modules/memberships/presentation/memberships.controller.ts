import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';
import { Role, Roles } from '@core/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import {
  CancelMembershipUseCase,
  ListMembershipsByCustomerUseCase,
  SubscribeMembershipUseCase,
} from '../application/membership-use-cases';
import { Membership } from '../domain/membership';

class SubscribeDto {
  @ApiProperty() @IsUUID() customerId!: string;
  @ApiProperty() @IsString() plan!: string;
  @ApiProperty() @Type(() => Date) @IsDate() startsAt!: Date;
  @ApiProperty() @Type(() => Date) @IsDate() endsAt!: Date;
  @ApiProperty({ minimum: 0, maximum: 100 }) @IsNumber() @Min(0) @Max(100) discountPct!: number;
}

@ApiTags('Memberships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('memberships')
export class MembershipsController {
  constructor(
    private readonly subUC: SubscribeMembershipUseCase,
    private readonly cancelUC: CancelMembershipUseCase,
    private readonly listUC: ListMembershipsByCustomerUseCase,
  ) {}

  @Post()
  @Roles(Role.Admin, Role.Receptionist)
  @HttpCode(HttpStatus.CREATED)
  async subscribe(@Body() dto: SubscribeDto) {
    return this.toJson(await this.subUC.execute(dto));
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Receptionist)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.cancelUC.execute(id);
  }

  @Get('by-customer/:customerId')
  @Roles(Role.Admin, Role.Receptionist, Role.Barber)
  async listByCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    const items = await this.listUC.execute(customerId);
    return items.map(this.toJson);
  }

  private toJson(m: Membership) {
    return {
      id: m.id.value,
      customerId: m.customerId.value,
      plan: m.plan,
      startsAt: m.startsAt,
      endsAt: m.endsAt,
      discountPct: m.discountPct,
      active: m.active,
    };
  }
}
