import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  Channel,
  NotificationLogDoc,
  NotificationLogDocument,
} from '../infrastructure/notification-log.schema';
import { EMAIL_NOTIFIER, Notifier, WHATSAPP_NOTIFIER } from './notifier.port';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(NotificationLogDoc.name) private readonly logs: Model<NotificationLogDocument>,
    @Inject(EMAIL_NOTIFIER) private readonly email: Notifier,
    @Inject(WHATSAPP_NOTIFIER) private readonly whatsapp: Notifier,
  ) {}

  async send(
    channel: Channel,
    input: { to: string; template: string; payload?: Record<string, unknown> },
  ): Promise<void> {
    const log = await this.logs.create({
      _id: uuidv4(),
      channel,
      recipient: input.to,
      template: input.template,
      payload: input.payload ?? {},
      status: 'PENDING',
    });
    try {
      const notifier =
        channel === 'EMAIL' ? this.email : channel === 'WHATSAPP' ? this.whatsapp : this.email;
      await notifier.send({ to: input.to, template: input.template, payload: input.payload ?? {} });
      await this.logs.findOneAndUpdate(
        { _id: log._id },
        { $set: { status: 'SENT', sentAt: new Date() } },
      );
    } catch (err) {
      this.logger.error('Failed to send notification', err as Error);
      await this.logs.findOneAndUpdate(
        { _id: log._id },
        { $set: { status: 'FAILED', error: (err as Error).message } },
      );
    }
  }

  list(limit = 50): Promise<NotificationLogDocument[]> {
    return this.logs.find().sort({ createdAt: -1 }).limit(limit);
  }
}
