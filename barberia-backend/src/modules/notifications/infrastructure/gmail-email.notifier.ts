import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Notifier } from '../application/notifier.port';
import { renderEmail } from './email-templates';
import { MailConfig } from '@config/mail.config';

@Injectable()
export class GmailEmailNotifier implements Notifier {
  private readonly logger = new Logger('EMAIL:GMAIL');
  private transporter: Transporter | null = null;
  private from = '';

  constructor(private readonly config: ConfigService) {}

  private ensureReady(): { transporter: Transporter; from: string } {
    if (this.transporter) return { transporter: this.transporter, from: this.from };
    const mail = this.config.get<MailConfig>('mail');
    if (!mail?.gmailUser || !mail?.gmailAppPassword) {
      throw new Error('GmailEmailNotifier requires GMAIL_USER and GMAIL_APP_PASSWORD');
    }
    this.from = mail.from ?? mail.gmailUser;
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: mail.gmailUser, pass: mail.gmailAppPassword },
    });
    return { transporter: this.transporter, from: this.from };
  }

  async send(input: {
    to: string;
    template: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const { transporter, from } = this.ensureReady();
    const { subject, html, text } = renderEmail(input.template, input.payload);
    const info = await transporter.sendMail({ from, to: input.to, subject, html, text });
    this.logger.log(`sent ${input.template} → ${input.to} (id=${info.messageId})`);
  }
}
