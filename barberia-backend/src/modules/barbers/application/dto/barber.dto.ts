import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ScheduleSlotDto {
  @ApiProperty({ minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime!: string;

  @ApiProperty({ example: '19:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime!: string;
}

export class CreateBarberDto {
  @ApiProperty() @IsUUID() userId!: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120) displayName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) specialty?: string;
  @ApiProperty() @IsNumber() @Min(0) @Max(100) commissionPct!: number;

  @ApiPropertyOptional({ type: [ScheduleSlotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  schedules?: ScheduleSlotDto[];
}

export class UpdateBarberDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) specialty?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) commissionPct?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}

export class SetSchedulesDto {
  @ApiProperty({ type: [ScheduleSlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  schedules!: ScheduleSlotDto[];
}

export class BlockTimeDto {
  @ApiProperty() @Type(() => Date) startsAt!: Date;
  @ApiProperty() @Type(() => Date) endsAt!: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) reason?: string;
}
