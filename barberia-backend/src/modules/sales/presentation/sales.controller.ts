import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Role, Roles } from '@core/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { SalesUseCases } from '../application/sale-use-cases';

class OpenSaleDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() barberId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() appointmentId?: string;
}

class AddItemDto {
  @ApiProperty({ enum: ['SERVICE', 'PRODUCT'] })
  @IsEnum(['SERVICE', 'PRODUCT'] as unknown as object)
  kind!: 'SERVICE' | 'PRODUCT';
  @ApiPropertyOptional() @IsOptional() @IsUUID() serviceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() productId?: string;
  @ApiProperty() @IsInt() @Min(1) qty!: number;
}

class AddPaymentDto {
  @ApiProperty({ enum: ['CASH', 'CARD', 'TRANSFER', 'YAPE', 'PLIN', 'OTHER'] })
  @IsEnum(['CASH', 'CARD', 'TRANSFER', 'YAPE', 'PLIN', 'OTHER'] as unknown as object)
  method!: 'CASH' | 'CARD' | 'TRANSFER' | 'YAPE' | 'PLIN' | 'OTHER';
  @ApiProperty() @IsInt() @Min(1) amountCents!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
}

class VoidDto {
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly uc: SalesUseCases) {}

  @Post()
  @Roles(Role.Admin, Role.Receptionist)
  @HttpCode(HttpStatus.CREATED)
  open(@Body() dto: OpenSaleDto) {
    return this.uc.open(dto);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Receptionist, Role.Barber)
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.uc.getById(id);
  }

  @Post(':id/items')
  @Roles(Role.Admin, Role.Receptionist)
  @HttpCode(HttpStatus.CREATED)
  addItem(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddItemDto) {
    return this.uc.addItem(id, dto);
  }

  @Post(':id/payments')
  @Roles(Role.Admin, Role.Receptionist)
  @HttpCode(HttpStatus.CREATED)
  addPayment(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddPaymentDto) {
    return this.uc.addPayment(id, dto);
  }

  @Post(':id/close')
  @Roles(Role.Admin, Role.Receptionist)
  close(@Param('id', ParseUUIDPipe) id: string) {
    return this.uc.close(id);
  }

  @Post(':id/void')
  @Roles(Role.Admin)
  voidSale(@Param('id', ParseUUIDPipe) id: string, @Body() dto: VoidDto) {
    return this.uc.void(id, dto?.reason);
  }

  @Get(':id/commission')
  @Roles(Role.Admin)
  commission(@Param('id', ParseUUIDPipe) id: string) {
    return this.uc.commissionFor(id);
  }
}
