import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel, NotificationLogOrmEntity } from '../infrastructure/notification-log.orm-entity';
import { EMAIL_NOTIFIER, Notifier, WHATSAPP_NOTIFIER } from './notifier.port';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationLogOrmEntity)
    private readonly logs: Repository<NotificationLogOrmEntity>,
    @Inject(EMAIL_NOTIFIER) private readonly email: Notifier,
    @Inject(WHATSAPP_NOTIFIER) private readonly whatsapp: Notifier,
  ) {}

  async send(
    channel: Channel,
    input: { to: string; template: string; payload?: Record<string, unknown> },
  ): Promise<void> {
    const log = await this.logs.save(
      this.logs.create({
        channel,
        recipient: input.to,
        template: input.template,
        payload: input.payload ?? {},
        status: 'PENDING',
      }),
    );
    try {
      const notifier =
        channel === 'EMAIL' ? this.email : channel === 'WHATSAPP' ? this.whatsapp : this.email;
      await notifier.send({ to: input.to, template: input.template, payload: input.payload ?? {} });
      log.status = 'SENT';
      log.sentAt = new Date();
      await this.logs.save(log);
    } catch (err) {
      this.logger.error('Failed to send notification', err as Error);
      log.status = 'FAILED';
      log.error = (err as Error).message;
      await this.logs.save(log);
    }
  }

  list(limit = 50): Promise<NotificationLogOrmEntity[]> {
    return this.logs.find({ order: { createdAt: 'DESC' }, take: limit });
  }
}
