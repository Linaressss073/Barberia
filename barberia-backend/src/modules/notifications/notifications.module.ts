import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationLogDoc, NotificationLogSchema } from './infrastructure/notification-log.schema';
import { NotificationsService } from './application/notifications.service';
import { ConsoleEmailNotifier } from './infrastructure/console-email.notifier';
import { ConsoleWhatsAppNotifier } from './infrastructure/console-whatsapp.notifier';
import { EMAIL_NOTIFIER, WHATSAPP_NOTIFIER } from './application/notifier.port';
import { NotificationsController } from './presentation/notifications.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: NotificationLogDoc.name, schema: NotificationLogSchema }]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    { provide: EMAIL_NOTIFIER, useClass: ConsoleEmailNotifier },
    { provide: WHATSAPP_NOTIFIER, useClass: ConsoleWhatsAppNotifier },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
