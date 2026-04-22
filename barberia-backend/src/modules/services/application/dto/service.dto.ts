import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ minimum: 1, maximum: 600 }) @IsInt() @Min(1) @Max(600) durationMin!: number;
  @ApiProperty({ description: 'Precio en centavos' }) @IsInt() @Min(0) priceCents!: number;
}

export class UpdateServiceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(600) durationMin?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) priceCents?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}

export class AddPromotionDto {
  @ApiProperty() @IsString() @MaxLength(120) name!: string;
  @ApiProperty({ minimum: 0, maximum: 100 }) @IsNumber() @Min(0) @Max(100) discountPct!: number;
  @ApiProperty() @Type(() => Date) @IsDate() validFrom!: Date;
  @ApiProperty() @Type(() => Date) @IsDate() validTo!: Date;
}
