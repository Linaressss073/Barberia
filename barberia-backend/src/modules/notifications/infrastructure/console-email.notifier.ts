import { Injectable, Logger } from '@nestjs/common';
import { Notifier } from '../application/notifier.port';

/**
 * Adapter por defecto: imprime a logs.
 * Reemplazable por SES, SendGrid, Resend, etc. sin tocar dominio.
 */
@Injectable()
export class ConsoleEmailNotifier implements Notifier {
  private readonly logger = new Logger('EMAIL');
  async send(input: {
    to: string;
    template: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    this.logger.log(`→ ${input.to} | ${input.template} ${JSON.stringify(input.payload)}`);
  }
}
