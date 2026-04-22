import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { Role, Roles } from '@core/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { NotificationsService } from '../application/notifications.service';
import { Channel } from '../infrastructure/notification-log.orm-entity';

class SendNotificationDto {
  @ApiProperty({ enum: ['EMAIL', 'WHATSAPP', 'SMS'] })
  @IsEnum(['EMAIL', 'WHATSAPP', 'SMS'] as unknown as object)
  channel!: Channel;

  @ApiProperty() @IsString() to!: string;
  @ApiProperty() @IsString() template!: string;

  @ApiProperty({ required: false, type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Post('send')
  @Roles(Role.Admin, Role.Receptionist)
  async send(@Body() dto: SendNotificationDto): Promise<{ ok: true }> {
    await this.svc.send(dto.channel, { to: dto.to, template: dto.template, payload: dto.payload });
    return { ok: true };
  }

  @Get('logs')
  @Roles(Role.Admin)
  list(@Query('limit') limit?: string) {
    return this.svc.list(limit ? parseInt(limit, 10) : 50);
  }
}
