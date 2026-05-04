import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'cliente@barberia.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: 'StrongPass1' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({ example: 'Barbería El Corte' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessName?: string;

  @ApiPropertyOptional({ enum: ['TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'] })
  @IsOptional()
  @IsIn(['TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'])
  plan?: 'TRIAL' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';

  @ApiPropertyOptional({
    description:
      'Obligatorio al registrarse como cliente (sin businessName). ID de la barbería (tenant) existente y activa.',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
