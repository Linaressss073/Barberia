import { registerAs } from '@nestjs/config';

export interface MailConfig {
  gmailUser: string | null;
  gmailAppPassword: string | null;
  from: string | null;
}

export const mailConfig = registerAs<MailConfig>('mail', () => {
  const user = (process.env.GMAIL_USER ?? '').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD ?? '').trim();
  const from = (process.env.MAIL_FROM ?? '').trim();
  return {
    gmailUser: user || null,
    gmailAppPassword: pass || null,
    from: from || user || null,
  };
});
