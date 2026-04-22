# Barberia Backend

Sistema Web de Agendamiento para Barbería — **Backend**.

Stack: **NestJS 10 + TypeScript 5 + TypeORM 0.3 + PostgreSQL 16 (Render)** sobre arquitectura **DDD + Clean Architecture**.

---

## 1. Arquitectura

```
src/
├── core/              # Kernel: Entity, AggregateRoot, ValueObject, Result, Exceptions, Filters, Interceptors
├── config/            # Configuración tipada y validada (env)
├── infrastructure/    # DataSource TypeORM, Health, Naming Strategy, Migrations, Seeds
├── shared/kernel/     # Value Objects compartidos entre módulos (Email, Money, Phone)
└── modules/
    └── auth/          # Bounded context (estructura replicada en cada módulo):
        ├── domain/            # Entidades, VOs, repositorios (interfaces)
        ├── application/       # Use cases, DTOs, ports (PasswordHasher, TokenSigner)
        ├── infrastructure/    # ORM entities, mappers, repos TypeORM, Bcrypt, JWT signer
        └── presentation/      # Controllers, Guards
```

Reglas no negociables:

- **Dominio puro**: no importa NestJS ni TypeORM.
- **ORM Entity ≠ Domain Entity**: hay un mapper por entidad.
- **`synchronize: false` siempre**. Migraciones son la fuente de verdad.
- **`Result<T,E>`** en flujos de validación de dominio; excepciones (`DomainException`) cuando se rompe una invariante.
- **VOs inmutables**: `Email`, `Money`, `Phone`, `RawPassword`, `HashedPassword`.

---

## 2. Requisitos

- Node.js >= 20.11
- PostgreSQL 16 (local o Render)
- npm >= 10

---

## 3. Setup local

```bash
cd barberia-backend
cp .env.example .env
# Editar DATABASE_URL y los JWT_*_SECRET (mín. 32 chars)
npm install
npm run migration:run
ADMIN_EMAIL=admin@local ADMIN_PASSWORD=Admin12345 npm run seed:run
npm run start:dev
```

Swagger: http://localhost:3000/api/v1/docs
Health: http://localhost:3000/api/v1/health

---

## 4. Migraciones (TypeORM)

```bash
# Generar migración a partir de cambios en ORM entities:
npm run migration:generate --name=AddCustomers
# Crear migración vacía:
npm run migration:create --name=BackfillRoles
# Aplicar:
npm run migration:run
# Revertir última:
npm run migration:revert
# Ver estado:
npm run migration:show
```

> **Nunca** usar `synchronize: true`. **Nunca** editar una migración ya aplicada en otro entorno: crear una nueva.

---

## 5. Despliegue en Render

El archivo `render.yaml` declara:

- `barberia-db` → PostgreSQL 16 administrado.
- `barberia-backend` → Web Service Node con auto-deploy desde `main`.

Pasos:

1. Hacer push del repo a GitHub.
2. En Render → **New → Blueprint** → seleccionar el repo.
3. Render leerá `render.yaml` y aprovisionará DB + Web Service.
4. Configurar manualmente `FRONTEND_URL` (no se puede inferir).
5. El `preDeployCommand` ejecuta `migration:run` **antes** del cambio de tráfico (si falla, el deploy se aborta y el tráfico permanece en la versión anterior). El `startCommand` ya **no** corre migraciones.
6. Health check apunta a `/api/v1/health`.

Variables generadas automáticamente: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`.

---

## 6. Endpoints (v0.2.0 — backend completo)

> Todos bajo prefix `/api/v1`. RBAC: **A** Admin · **R** Receptionist · **B** Barber · **C** Customer.

### Auth (público / Bearer)
| Método | Path | Auth | Descripción |
| ------ | ---- | ---- | ----------- |
| GET    | `/health`              | público | Health DB + memoria |
| POST   | `/auth/register`       | público | Registro Customer |
| POST   | `/auth/login`          | público | Access + refresh tokens |
| POST   | `/auth/refresh`        | público | Rotación refresh |
| POST   | `/auth/logout`         | Bearer | Revoca refresh + denylist del access actual (jti) |

### Users (admin)
| GET `/users` · POST `/users` · PATCH `/users/:id/roles` · PATCH `/users/:id/enable` · PATCH `/users/:id/disable` | A |

### Customers
| GET `/customers` (A/R/B) · GET `/customers/:id` (A/R/B) · POST `/customers` (A/R) · PATCH `/customers/:id` (A/R) · DELETE `/customers/:id` (A) · POST `/customers/:id/loyalty/add/:points` (A/R) · POST `/customers/:id/loyalty/redeem/:points` (A/R) |

### Barbers
| GET `/barbers` (todos) · GET `/barbers/:id` (todos) · POST `/barbers` (A) · PATCH `/barbers/:id` (A) · POST `/barbers/:id/schedules` (A) · POST `/barbers/:id/blocks` (A/R) |

### Services
| GET `/services` (todos) · GET `/services/:id` (todos) · POST `/services` (A) · PATCH `/services/:id` (A) · POST `/services/:id/promotions` (A) · DELETE `/services/:id` (A) |

### Memberships
| POST `/memberships` (A/R) · DELETE `/memberships/:id` (A/R) · GET `/memberships/by-customer/:customerId` (A/R/B) |

### Inventory
| GET `/inventory/products` (A/R/B) · GET `/inventory/products/low-stock` (A/R) · GET `/inventory/products/:id` · POST `/inventory/products` (A) · PATCH `/inventory/products/:id` (A) · POST `/inventory/products/:id/in` (A/R) · POST `/inventory/products/:id/out` (A/R) · POST `/inventory/products/:id/adjust/:newStock` (A) |

### Appointments
| GET `/appointments/availability?barberId&date&durationMin` (todos) · GET `/appointments` (todos) · POST `/appointments` (A/R/C) · PATCH `/appointments/:id/confirm` (A/R/B) · PATCH `/appointments/:id/complete` (A/R/B) · PATCH `/appointments/:id/no-show` (A/R) · PATCH `/appointments/:id/cancel` (todos; clientes ≥2h) |

### Sales (POS)
| POST `/sales` (A/R) · GET `/sales/:id` (A/R/B) · POST `/sales/:id/items` (A/R) · POST `/sales/:id/payments` (A/R) · POST `/sales/:id/close` (A/R) · POST `/sales/:id/void` (A) · GET `/sales/:id/commission` (A) |

### Reports (admin)
| GET `/reports/sales/daily` · GET `/reports/services/top` · GET `/reports/barbers/occupancy` · GET `/reports/barbers/commissions` · GET `/reports/customers/top` |

### Settings
| GET `/settings` (A) · GET `/settings/:key` (A/R) · PUT `/settings/:key` (A) |

### Notifications
| POST `/notifications/send` (A/R) · GET `/notifications/logs` (A) |

Contrato de respuesta:

```json
{ "success": true, "data": { /* ... */ }, "timestamp": "2026-04-22T..." }
```

Contrato de error:

```json
{
  "statusCode": 422,
  "code": "BUSINESS_RULE_VIOLATION",
  "message": "User is disabled",
  "path": "/api/v1/auth/login",
  "timestamp": "2026-04-22T...",
  "details": { }
}
```

---

## 7. Reglas de negocio garantizadas a nivel BD

| Riesgo | Mitigación a nivel motor |
| ------ | ------------------------ |
| Doble booking de barbero | `EXCLUDE USING gist (barber_id WITH =, tstzrange(scheduled_at, ends_at, '[)') WITH &&) WHERE status NOT IN ('CANCELLED','NO_SHOW')` |
| Stock negativo | `CHECK (stock >= 0)` + `UPDATE … WHERE stock >= :qty` atómico |
| Cancelación tardía | `BusinessRuleViolation` server-side si faltan <2h y el caller no es Admin/Receptionist |
| Total negativo / pagos < total | `CHECK (total_cents >= 0)` + validación en `close()` |
| Solapes de bloqueos del barbero | Verificación `tstzrange && tstzrange` previo al INSERT |
| Sales cerradas mutables | Estado `OPEN/CLOSED/VOIDED` con `pessimistic_write` lock |
| Citas duplicadas vinculadas a venta | `appointment_id UNIQUE` en `sales` |

## 8. Cross-cutting

- **RequestContext (AsyncLocalStorage)**: `requestId`, `userId`, `userEmail`, `userRoles`, `ip`, `userAgent`.
- **AuditInterceptor**: persiste `audit_logs` para todo `POST/PUT/PATCH/DELETE` (no bloqueante).
- **JWT denylist por `jti`**: `/auth/logout` revoca el access token aún no expirado.
- **JwtStrategy** consulta denylist en cada request autenticada.
- **UnitOfWork**: wrapper de `dataSource.transaction(level, work)` reutilizable.

## 9. Roadmap

### Entregado (v0.2.0)
- Plataforma + Auth (register, login, refresh rotativo, logout con denylist)
- Users (admin), Customers, Barbers (+ horarios + bloqueos), Services (+ promos)
- Memberships, Inventory (stock atómico), Appointments (anti doble-booking gist), Sales (POS transaccional, comisión, descuento VIP, loyalty automático), Reports, Settings, Notifications (adapter)
- AuditModule global · RequestContext · Migración por dominio (DomainSchema)
- Render `preDeployCommand` para migraciones seguras

### Próximos pasos
- Tests unitarios por use case + e2e con Testcontainers (Postgres real para validar `EXCLUDE gist`).
- CI GitHub Actions → Render.
- SES/SendGrid + Twilio adapters reemplazando consoles.
- Outbox + retry de notifications.
- Frontend Next.js (App Router).
- Reportes a Excel/CSV + dashboards.

---

## 10. Convenciones de código

- Carpetas en `kebab-case`, archivos `kebab-case.ts`, clases `PascalCase`.
- Tokens DI con `Symbol(...)` exportados desde el dominio.
- DTOs validados con `class-validator` + `whitelist:true, forbidNonWhitelisted:true`.
- Tests unitarios `*.spec.ts` junto al archivo, e2e en `/test`.
- Git Flow: `main` (prod) ← `develop` ← `feature/*`, `hotfix/*`.
