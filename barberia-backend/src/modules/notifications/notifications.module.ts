import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationLogOrmEntity } from './infrastructure/notification-log.orm-entity';
import { NotificationsService } from './application/notifications.service';
import { ConsoleEmailNotifier } from './infrastructure/console-email.notifier';
import { ConsoleWhatsAppNotifier } from './infrastructure/console-whatsapp.notifier';
import { EMAIL_NOTIFIER, WHATSAPP_NOTIFIER } from './application/notifier.port';
import { NotificationsController } from './presentation/notifications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationLogOrmEntity])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    { provide: EMAIL_NOTIFIER, useClass: ConsoleEmailNotifier },
    { provide: WHATSAPP_NOTIFIER, useClass: ConsoleWhatsAppNotifier },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
