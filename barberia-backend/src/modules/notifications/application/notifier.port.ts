export const EMAIL_NOTIFIER = Symbol('EMAIL_NOTIFIER');
export const WHATSAPP_NOTIFIER = Symbol('WHATSAPP_NOTIFIER');

export interface Notifier {
  send(input: { to: string; template: string; payload: Record<string, unknown> }): Promise<void>;
}
