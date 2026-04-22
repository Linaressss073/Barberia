import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Role, Roles } from '@core/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { PaginationQueryDto } from '@shared/pagination/pagination.dto';
import { InventoryUseCases } from '../application/inventory-use-cases';

class CreateProductDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(64) sku!: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @ApiProperty() @IsInt() @Min(0) costCents!: number;
  @ApiProperty() @IsInt() @Min(0) salePriceCents!: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) initialStock?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) minStock?: number;
}

class UpdateProductDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) costCents?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) salePriceCents?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) minStock?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}

class StockMoveDto {
  @ApiProperty() @IsInt() @Min(1) qty!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) reason?: string;
}

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly uc: InventoryUseCases) {}

  @Get('products')
  @Roles(Role.Admin, Role.Receptionist, Role.Barber)
  list(@Query() q: PaginationQueryDto) {
    return this.uc.list(q);
  }

  @Get('products/low-stock')
  @Roles(Role.Admin, Role.Receptionist)
  lowStock() {
    return this.uc.listLowStock();
  }

  @Get('products/:id')
  @Roles(Role.Admin, Role.Receptionist, Role.Barber)
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.uc.getById(id);
  }

  @Post('products')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto) {
    return this.uc.createProduct(dto);
  }

  @Patch('products/:id')
  @Roles(Role.Admin)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.uc.updateProduct(id, dto);
  }

  @Post('products/:id/in')
  @Roles(Role.Admin, Role.Receptionist)
  @HttpCode(HttpStatus.NO_CONTENT)
  async stockIn(@Param('id', ParseUUIDPipe) id: string, @Body() dto: StockMoveDto): Promise<void> {
    await this.uc.registerIn(id, dto.qty, dto.reason);
  }

  @Post('products/:id/out')
  @Roles(Role.Admin, Role.Receptionist)
  @HttpCode(HttpStatus.NO_CONTENT)
  async stockOut(@Param('id', ParseUUIDPipe) id: string, @Body() dto: StockMoveDto): Promise<void> {
    await this.uc.registerOut(id, dto.qty, dto.reason);
  }

  @Post('products/:id/adjust/:newStock')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async adjust(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('newStock', ParseIntPipe) newStock: number,
    @Body() dto: { reason?: string },
  ): Promise<void> {
    await this.uc.adjust(id, newStock, dto?.reason);
  }
}
