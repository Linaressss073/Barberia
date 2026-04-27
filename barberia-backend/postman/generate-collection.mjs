/**
 * Genera Barberia-API.postman_collection.json
 * Ejecutar desde la raíz del backend: node postman/generate-collection.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Coincide con GLOBAL_PREFIX del backend (por defecto `api/v1`, sin slashes extra). */
const GLOBAL_PREFIX = '/api/v1';

function R(name, method, path, opts = {}) {
  const isPublic = opts.public === true;
  const headers = [];
  if (!isPublic) {
    headers.push({ key: 'Authorization', value: 'Bearer {{accessToken}}', type: 'text' });
  }
  const hasBody = opts.body !== undefined && opts.body !== null;
  if (hasBody || (opts.forceJson && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method))) {
    headers.push({ key: 'Content-Type', value: 'application/json', type: 'text' });
  }

  const rel = path.startsWith('/') ? path : '/' + path;
  const req = {
    method,
    header: headers,
    url: `{{baseUrl}}${GLOBAL_PREFIX}${rel}`,
    description: opts.desc ?? '',
  };

  if (hasBody) {
    req.body = {
      mode: 'raw',
      raw: typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body, null, 2),
      options: { raw: { language: 'json' } },
    };
  }

  const item = { name, request: req };
  if (opts.event) item.event = opts.event;
  return item;
}

const loginTests = [
  'try {',
  '  const json = pm.response.json();',
  '  const data = json.data !== undefined ? json.data : json;',
  '  if (data.tokens) {',
  '    pm.collectionVariables.set("accessToken", data.tokens.accessToken);',
  '    pm.collectionVariables.set("refreshToken", data.tokens.refreshToken);',
  '  }',
  '} catch (e) {}',
];

const refreshTests = [
  'try {',
  '  const json = pm.response.json();',
  '  const data = json.data !== undefined ? json.data : json;',
  '  if (data.accessToken) pm.collectionVariables.set("accessToken", data.accessToken);',
  '  if (data.refreshToken) pm.collectionVariables.set("refreshToken", data.refreshToken);',
  '} catch (e) {}',
];

const collection = {
  info: {
    name: 'Barbería API',
    description:
      'Backend NestJS Barbería. Variable `baseUrl` = solo origen (ej. `http://localhost:3000`). Todas las URLs incluyen explícitamente `/api/v1` (GLOBAL_PREFIX). Respuestas OK: `{ success, data, timestamp }`. Ejecuta **Login** para guardar tokens.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000' },
    { key: 'accessToken', value: '' },
    { key: 'refreshToken', value: '' },
    { key: 'customerId', value: '' },
    { key: 'barberId', value: '' },
    { key: 'appointmentId', value: '' },
    { key: 'saleId', value: '' },
    { key: 'serviceId', value: '' },
    { key: 'productId', value: '' },
    { key: 'membershipId', value: '' },
    { key: 'userId', value: '' },
    { key: 'settingsKey', value: 'ejemplo_clave' },
    { key: 'points', value: '10' },
  ],
  item: [
    {
      name: 'Health',
      item: [R('GET health', 'GET', '/health', { public: true })],
    },
    {
      name: 'Auth',
      item: [
        R('POST register', 'POST', '/auth/register', {
          public: true,
          body: { email: 'cliente@ejemplo.com', fullName: 'Cliente Demo', password: 'StrongPass1' },
        }),
        {
          ...R('POST login', 'POST', '/auth/login', {
            public: true,
            body: { email: 'admin@local', password: 'Admin12345' },
            desc: 'Ajusta email/password a tu seed. Tests guardan accessToken y refreshToken.',
          }),
          event: [{ listen: 'test', script: { exec: loginTests, type: 'text/javascript' } }],
        },
        {
          ...R('POST refresh', 'POST', '/auth/refresh', {
            public: true,
            body: { refreshToken: '{{refreshToken}}' },
          }),
          event: [{ listen: 'test', script: { exec: refreshTests, type: 'text/javascript' } }],
        },
        R('POST logout', 'POST', '/auth/logout', { body: {} }),
      ],
    },
    {
      name: 'Users (Admin)',
      item: [
        R('GET list', 'GET', '/users?page=1&limit=20&search=&role=&status='),
        R('POST create', 'POST', '/users', {
          body: {
            email: 'nuevo@ejemplo.com',
            fullName: 'Usuario Nuevo',
            password: 'StrongPass1',
            roles: ['RECEPTIONIST'],
          },
        }),
        R('PATCH roles', 'PATCH', '/users/{{userId}}/roles', { body: { roles: ['BARBER'] } }),
        R('PATCH enable', 'PATCH', '/users/{{userId}}/enable'),
        R('PATCH disable', 'PATCH', '/users/{{userId}}/disable'),
      ],
    },
    {
      name: 'Customers',
      item: [
        R('GET list', 'GET', '/customers?page=1&limit=20'),
        R('GET by id', 'GET', '/customers/{{customerId}}'),
        R('POST create', 'POST', '/customers', {
          body: {
            fullName: 'Cliente',
            phone: '+51999000000',
            userId: '{{userId}}',
          },
        }),
        R('PATCH update', 'PATCH', '/customers/{{customerId}}', { body: { fullName: 'Cliente Actualizado' } }),
        R('DELETE soft', 'DELETE', '/customers/{{customerId}}'),
        R('POST loyalty add', 'POST', '/customers/{{customerId}}/loyalty/add/{{points}}'),
        R('POST loyalty redeem', 'POST', '/customers/{{customerId}}/loyalty/redeem/{{points}}'),
      ],
    },
    {
      name: 'Barbers',
      item: [
        R('GET list', 'GET', '/barbers?page=1&limit=20&onlyActive=false&search='),
        R('GET by id', 'GET', '/barbers/{{barberId}}'),
        R('POST create', 'POST', '/barbers', {
          body: {
            userId: '{{userId}}',
            displayName: 'Barbero',
            specialty: 'Corte',
            commissionPct: 40,
            schedules: [{ weekday: 1, startTime: '09:00', endTime: '18:00' }],
          },
        }),
        R('PATCH update', 'PATCH', '/barbers/{{barberId}}', { body: { active: true } }),
        R('POST schedules', 'POST', '/barbers/{{barberId}}/schedules', {
          body: {
            schedules: [{ weekday: 1, startTime: '09:00', endTime: '18:00' }],
          },
        }),
        R('POST block', 'POST', '/barbers/{{barberId}}/blocks', {
          body: {
            startsAt: '2026-12-01T12:00:00.000Z',
            endsAt: '2026-12-01T13:00:00.000Z',
            reason: 'Almuerzo',
          },
        }),
      ],
    },
    {
      name: 'Services',
      item: [
        R('GET list', 'GET', '/services?page=1&limit=20'),
        R('GET by id', 'GET', '/services/{{serviceId}}'),
        R('POST create', 'POST', '/services', {
          body: {
            name: 'Corte',
            description: 'Corte clásico',
            durationMin: 30,
            priceCents: 2500,
          },
        }),
        R('PATCH update', 'PATCH', '/services/{{serviceId}}', { body: { active: true } }),
        R('POST promotion', 'POST', '/services/{{serviceId}}/promotions', {
          body: {
            name: 'Promo verano',
            discountPct: 10,
            validFrom: '2026-01-01T00:00:00.000Z',
            validTo: '2026-12-31T23:59:59.000Z',
          },
        }),
        R('DELETE service', 'DELETE', '/services/{{serviceId}}'),
      ],
    },
    {
      name: 'Memberships',
      item: [
        R('POST subscribe', 'POST', '/memberships', {
          body: {
            customerId: '{{customerId}}',
            plan: 'VIP',
            startsAt: '2026-01-01T00:00:00.000Z',
            endsAt: '2026-12-31T23:59:59.000Z',
            discountPct: 10,
          },
        }),
        R('DELETE cancel', 'DELETE', '/memberships/{{membershipId}}'),
        R('GET by customer', 'GET', '/memberships/by-customer/{{customerId}}'),
      ],
    },
    {
      name: 'Inventory',
      item: [
        R('GET products', 'GET', '/inventory/products?page=1&limit=20'),
        R('GET low stock', 'GET', '/inventory/products/low-stock'),
        R('GET product', 'GET', '/inventory/products/{{productId}}'),
        R('POST create product', 'POST', '/inventory/products', {
          body: {
            sku: 'SKU-001',
            name: 'Cera',
            costCents: 500,
            salePriceCents: 1500,
            initialStock: 10,
            minStock: 2,
          },
        }),
        R('PATCH update product', 'PATCH', '/inventory/products/{{productId}}', { body: { name: 'Cera premium' } }),
        R('POST stock in', 'POST', '/inventory/products/{{productId}}/in', { body: { qty: 5, reason: 'Compra' } }),
        R('POST stock out', 'POST', '/inventory/products/{{productId}}/out', { body: { qty: 1, reason: 'Venta' } }),
        R('POST adjust', 'POST', '/inventory/products/{{productId}}/adjust/100', {
          body: { reason: 'Inventario físico' },
          forceJson: true,
        }),
      ],
    },
    {
      name: 'Appointments',
      item: [
        R(
          'GET availability',
          'GET',
          '/appointments/availability?barberId={{barberId}}&date=2026-06-15T09:00:00.000Z&durationMin=30',
        ),
        R(
          'GET list',
          'GET',
          '/appointments?page=1&limit=20&customerId=&barberId=&status=&from=&to=',
        ),
        R('POST book', 'POST', '/appointments', {
          body: {
            customerId: '{{customerId}}',
            barberId: '{{barberId}}',
            scheduledAt: '2026-06-15T15:00:00.000Z',
            serviceIds: ['{{serviceId}}'],
            source: 'WEB',
            notes: '',
          },
        }),
        R('PATCH confirm', 'PATCH', '/appointments/{{appointmentId}}/confirm'),
        R('PATCH complete', 'PATCH', '/appointments/{{appointmentId}}/complete'),
        R('PATCH no-show', 'PATCH', '/appointments/{{appointmentId}}/no-show'),
        R('PATCH cancel', 'PATCH', '/appointments/{{appointmentId}}/cancel', { body: { reason: 'Cliente avisó' } }),
      ],
    },
    {
      name: 'Sales (POS)',
      item: [
        R('POST open', 'POST', '/sales', {
          body: { customerId: '{{customerId}}', barberId: '{{barberId}}', appointmentId: '{{appointmentId}}' },
        }),
        R('GET by id', 'GET', '/sales/{{saleId}}'),
        R('POST item', 'POST', '/sales/{{saleId}}/items', {
          body: { kind: 'SERVICE', serviceId: '{{serviceId}}', qty: 1 },
        }),
        R('POST payment', 'POST', '/sales/{{saleId}}/payments', {
          body: { method: 'CASH', amountCents: 5000, reference: '' },
        }),
        R('POST close', 'POST', '/sales/{{saleId}}/close'),
        R('POST void', 'POST', '/sales/{{saleId}}/void', { body: { reason: 'Error en caja' } }),
        R('GET commission', 'GET', '/sales/{{saleId}}/commission'),
      ],
    },
    {
      name: 'Reports (Admin)',
      item: [
        R(
          'GET sales daily',
          'GET',
          '/reports/sales/daily?from=2026-01-01T00:00:00.000Z&to=2026-01-31T23:59:59.000Z',
        ),
        R(
          'GET services top',
          'GET',
          '/reports/services/top?from=2026-01-01T00:00:00.000Z&to=2026-01-31T23:59:59.000Z&limit=10',
        ),
        R(
          'GET barbers occupancy',
          'GET',
          '/reports/barbers/occupancy?from=2026-01-01T00:00:00.000Z&to=2026-01-31T23:59:59.000Z',
        ),
        R(
          'GET barbers commissions',
          'GET',
          '/reports/barbers/commissions?from=2026-01-01T00:00:00.000Z&to=2026-01-31T23:59:59.000Z',
        ),
        R(
          'GET customers top',
          'GET',
          '/reports/customers/top?from=2026-01-01T00:00:00.000Z&to=2026-01-31T23:59:59.000Z&limit=10',
        ),
      ],
    },
    {
      name: 'Settings',
      item: [
        R('GET list', 'GET', '/settings'),
        R('GET by key', 'GET', '/settings/{{settingsKey}}'),
        R('PUT upsert', 'PUT', '/settings/{{settingsKey}}', { body: { value: { enabled: true } } }),
      ],
    },
    {
      name: 'Notifications',
      item: [
        R('POST send', 'POST', '/notifications/send', {
          body: {
            channel: 'EMAIL',
            to: 'cliente@ejemplo.com',
            template: 'appointment_reminder',
            payload: { name: 'Cliente' },
          },
        }),
        R('GET logs', 'GET', '/notifications/logs?limit=50'),
      ],
    },
  ],
};

writeFileSync(join(__dirname, 'Barberia-API.postman_collection.json'), JSON.stringify(collection, null, 2));
console.log('OK → postman/Barberia-API.postman_collection.json');
