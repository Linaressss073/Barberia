import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum AppointmentSourceDto {
  WEB = 'WEB',
  PHONE = 'PHONE',
  WALKIN = 'WALKIN',
  ADMIN = 'ADMIN',
}

export class BookAppointmentDto {
  @ApiProperty() @IsUUID() customerId!: string;
  @ApiProperty() @IsUUID() barberId!: string;
  @ApiProperty() @Type(() => Date) @IsDate() scheduledAt!: Date;
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  serviceIds!: string[];
  @ApiPropertyOptional({ enum: AppointmentSourceDto, default: AppointmentSourceDto.WEB })
  @IsOptional()
  @IsEnum(AppointmentSourceDto)
  source?: AppointmentSourceDto;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class CancelAppointmentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) reason?: string;
}
