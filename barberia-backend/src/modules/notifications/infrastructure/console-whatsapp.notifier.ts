import { Injectable, Logger } from '@nestjs/common';
import { Notifier } from '../application/notifier.port';

@Injectable()
export class ConsoleWhatsAppNotifier implements Notifier {
  private readonly logger = new Logger('WHATSAPP');
  async send(input: {
    to: string;
    template: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    this.logger.log(`→ ${input.to} | ${input.template} ${JSON.stringify(input.payload)}`);
  }
}
