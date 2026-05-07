export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

type Renderer = (payload: Record<string, unknown>) => RenderedEmail;

const escape = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatDate = (iso: unknown): string => {
  if (typeof iso !== 'string') return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-PE', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  });
};

const formatMoney = (cents: unknown): string => {
  const n = Number(cents);
  if (!Number.isFinite(n)) return '';
  return `S/ ${(n / 100).toFixed(2)}`;
};

const layout = (title: string, body: string): string => `
<!doctype html>
<html lang="es">
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f6f7f9; margin:0; padding:24px; color:#111;">
    <div style="max-width:560px; margin:0 auto; background:#fff; border-radius:12px; padding:32px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <h1 style="margin:0 0 16px; font-size:20px;">${escape(title)}</h1>
      ${body}
      <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
      <p style="font-size:12px; color:#888; margin:0;">Este es un mensaje automático, no respondas a este correo.</p>
    </div>
  </body>
</html>
`;

const bookedRenderer: Renderer = (p) => {
  const services = Array.isArray(p['services']) ? (p['services'] as unknown[]) : [];
  const subject = `Reserva confirmada — ${formatDate(p['scheduledAt'])}`;
  const text = [
    `Hola ${p['customerName'] ?? ''},`,
    '',
    `Tu reserva fue registrada para ${formatDate(p['scheduledAt'])}.`,
    p['barberName'] ? `Barbero: ${p['barberName']}` : null,
    services.length ? `Servicios: ${services.join(', ')}` : null,
    p['totalCents'] != null ? `Total: ${formatMoney(p['totalCents'])}` : null,
    '',
    'Te esperamos.',
  ]
    .filter(Boolean)
    .join('\n');
  const body = `
    <p>Hola <strong>${escape(p['customerName'])}</strong>,</p>
    <p>Tu reserva fue registrada para:</p>
    <p style="font-size:16px;"><strong>${escape(formatDate(p['scheduledAt']))}</strong></p>
    ${p['barberName'] ? `<p>Barbero: <strong>${escape(p['barberName'])}</strong></p>` : ''}
    ${services.length ? `<p>Servicios: ${services.map(escape).join(', ')}</p>` : ''}
    ${p['totalCents'] != null ? `<p>Total estimado: <strong>${escape(formatMoney(p['totalCents']))}</strong></p>` : ''}
    <p>Te esperamos.</p>
  `;
  return { subject, html: layout('Reserva confirmada', body), text };
};

const confirmedRenderer: Renderer = (p) => {
  const subject = `Tu cita fue confirmada — ${formatDate(p['scheduledAt'])}`;
  const body = `
    <p>Hola <strong>${escape(p['customerName'])}</strong>,</p>
    <p>Tu cita ha sido <strong>confirmada</strong> para:</p>
    <p style="font-size:16px;"><strong>${escape(formatDate(p['scheduledAt']))}</strong></p>
    <p>Si necesitas reprogramar, responde a la barbería con anticipación.</p>
  `;
  const text = `Hola ${p['customerName'] ?? ''},\n\nTu cita ha sido confirmada para ${formatDate(p['scheduledAt'])}.`;
  return { subject, html: layout('Cita confirmada', body), text };
};

const cancelledRenderer: Renderer = (p) => {
  const subject = `Tu cita fue cancelada — ${formatDate(p['scheduledAt'])}`;
  const reason = p['reason'] ? `<p>Motivo: ${escape(p['reason'])}</p>` : '';
  const body = `
    <p>Hola <strong>${escape(p['customerName'])}</strong>,</p>
    <p>Te confirmamos que tu cita del <strong>${escape(formatDate(p['scheduledAt']))}</strong> fue <strong>cancelada</strong>.</p>
    ${reason}
    <p>Puedes agendar una nueva cuando lo prefieras.</p>
  `;
  const text = `Hola ${p['customerName'] ?? ''},\n\nTu cita del ${formatDate(p['scheduledAt'])} fue cancelada.${p['reason'] ? `\nMotivo: ${p['reason']}` : ''}`;
  return { subject, html: layout('Cita cancelada', body), text };
};

const completedRenderer: Renderer = (p) => {
  const subject = '¡Gracias por tu visita!';
  const body = `
    <p>Hola <strong>${escape(p['customerName'])}</strong>,</p>
    <p>Esperamos que hayas disfrutado tu servicio del <strong>${escape(formatDate(p['scheduledAt']))}</strong>.</p>
    <p>Nos encantaría tu opinión la próxima vez que ingreses a la app.</p>
  `;
  const text = `Hola ${p['customerName'] ?? ''},\n\nGracias por tu visita del ${formatDate(p['scheduledAt'])}.`;
  return { subject, html: layout('¡Gracias por tu visita!', body), text };
};

const fallbackRenderer = (template: string): Renderer => (p) => {
  const subject = `Notificación: ${template}`;
  const body = `<p>${escape(JSON.stringify(p))}</p>`;
  return { subject, html: layout(subject, body), text: `${subject}\n\n${JSON.stringify(p)}` };
};

const REGISTRY: Record<string, Renderer> = {
  'appointment.booked': bookedRenderer,
  'appointment.confirmed': confirmedRenderer,
  'appointment.cancelled': cancelledRenderer,
  'appointment.completed': completedRenderer,
};

export function renderEmail(template: string, payload: Record<string, unknown>): RenderedEmail {
  const renderer = REGISTRY[template] ?? fallbackRenderer(template);
  return renderer(payload);
}
