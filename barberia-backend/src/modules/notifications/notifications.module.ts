import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationLogDoc, NotificationLogSchema } from './infrastructure/notification-log.schema';
import { NotificationsService } from './application/notifications.service';
import { ConsoleEmailNotifier } from './infrastructure/console-email.notifier';
import { ConsoleWhatsAppNotifier } from './infrastructure/console-whatsapp.notifier';
import { GmailEmailNotifier } from './infrastructure/gmail-email.notifier';
import { EMAIL_NOTIFIER, Notifier, WHATSAPP_NOTIFIER } from './application/notifier.port';
import { NotificationsController } from './presentation/notifications.controller';
import { MailConfig } from '@config/mail.config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: NotificationLogDoc.name, schema: NotificationLogSchema }]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ConsoleEmailNotifier,
    GmailEmailNotifier,
    {
      provide: EMAIL_NOTIFIER,
      inject: [ConfigService, ConsoleEmailNotifier, GmailEmailNotifier],
      useFactory: (
        config: ConfigService,
        consoleNotifier: ConsoleEmailNotifier,
        gmailNotifier: GmailEmailNotifier,
      ): Notifier => {
        const mail = config.get<MailConfig>('mail');
        if (mail?.gmailUser && mail?.gmailAppPassword) {
          new Logger('NotificationsModule').log(`EMAIL adapter: Gmail (${mail.gmailUser})`);
          return gmailNotifier;
        }
        new Logger('NotificationsModule').warn(
          'EMAIL adapter: console (set GMAIL_USER + GMAIL_APP_PASSWORD to enable real email)',
        );
        return consoleNotifier;
      },
    },
    { provide: WHATSAPP_NOTIFIER, useClass: ConsoleWhatsAppNotifier },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
