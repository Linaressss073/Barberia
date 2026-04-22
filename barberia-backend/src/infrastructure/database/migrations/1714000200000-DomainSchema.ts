import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Esquema completo del dominio de negocio.
 * - customers / barbers / barber_schedules / barber_blocks
 * - services / service_promotions
 * - memberships
 * - inventory_products / inventory_movements
 * - appointments / appointment_items   (anti doble-booking con EXCLUDE USING gist)
 * - sales / sale_items / payments
 * - reviews
 * - settings
 * - notification_logs
 *
 * Reglas duras a nivel BD:
 *  - CHECK (stock >= 0)
 *  - CHECK (total_cents >= 0)
 *  - EXCLUDE USING gist en appointments (doble booking imposible)
 */
export class DomainSchema1714000200000 implements MigrationInterface {
  name = 'DomainSchema1714000200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // -------- CUSTOMERS ----------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"         uuid UNIQUE,
        "document"        varchar(32) UNIQUE,
        "full_name"       varchar(120) NOT NULL,
        "phone"           varchar(20),
        "birthdate"       date,
        "loyalty_points"  int NOT NULL DEFAULT 0 CHECK ("loyalty_points" >= 0),
        "preferences"     jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now(),
        "deleted_at"      timestamptz,
        CONSTRAINT "fk_customers_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "ix_customers_full_name" ON "customers" ("full_name")`);

    // -------- BARBERS ------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "barbers" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"         uuid UNIQUE NOT NULL,
        "display_name"    varchar(120) NOT NULL,
        "specialty"       varchar(120),
        "hire_date"       date NOT NULL DEFAULT CURRENT_DATE,
        "commission_pct"  numeric(5,2) NOT NULL DEFAULT 0 CHECK ("commission_pct" BETWEEN 0 AND 100),
        "active"          boolean NOT NULL DEFAULT true,
        "rating_avg"      numeric(3,2) NOT NULL DEFAULT 0,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_barbers_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "barber_schedules" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "barber_id"   uuid NOT NULL,
        "weekday"     smallint NOT NULL CHECK ("weekday" BETWEEN 0 AND 6),
        "start_time"  time NOT NULL,
        "end_time"    time NOT NULL,
        CONSTRAINT "fk_barber_schedules_barber_id" FOREIGN KEY ("barber_id") REFERENCES "barbers" ("id") ON DELETE CASCADE,
        CONSTRAINT "ck_barber_schedules_time" CHECK ("end_time" > "start_time"),
        CONSTRAINT "uq_barber_schedules_barber_id_weekday" UNIQUE ("barber_id", "weekday")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "barber_blocks" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "barber_id"   uuid NOT NULL,
        "starts_at"   timestamptz NOT NULL,
        "ends_at"     timestamptz NOT NULL,
        "reason"      varchar(255),
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_barber_blocks_barber_id" FOREIGN KEY ("barber_id") REFERENCES "barbers" ("id") ON DELETE CASCADE,
        CONSTRAINT "ck_barber_blocks_range" CHECK ("ends_at" > "starts_at")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_barber_blocks_barber_id_starts_at" ON "barber_blocks" ("barber_id","starts_at")`,
    );

    // -------- SERVICES -----------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name"          varchar(120) NOT NULL,
        "description"   text,
        "duration_min"  int NOT NULL CHECK ("duration_min" > 0 AND "duration_min" <= 600),
        "price_cents"   int NOT NULL CHECK ("price_cents" >= 0),
        "active"        boolean NOT NULL DEFAULT true,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        "updated_at"    timestamptz NOT NULL DEFAULT now(),
        "deleted_at"    timestamptz
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_services_name_active" ON "services" ("name") WHERE "deleted_at" IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "service_promotions" (
        "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "service_id"   uuid NOT NULL,
        "name"         varchar(120) NOT NULL,
        "discount_pct" numeric(5,2) NOT NULL CHECK ("discount_pct" BETWEEN 0 AND 100),
        "valid_from"   timestamptz NOT NULL,
        "valid_to"     timestamptz NOT NULL,
        CONSTRAINT "fk_service_promotions_service_id" FOREIGN KEY ("service_id") REFERENCES "services" ("id") ON DELETE CASCADE,
        CONSTRAINT "ck_service_promotions_range" CHECK ("valid_to" > "valid_from")
      )
    `);

    // -------- MEMBERSHIPS --------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "memberships" (
        "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "customer_id"  uuid NOT NULL,
        "plan"         varchar(32) NOT NULL,
        "starts_at"    timestamptz NOT NULL DEFAULT now(),
        "ends_at"      timestamptz NOT NULL,
        "discount_pct" numeric(5,2) NOT NULL DEFAULT 0 CHECK ("discount_pct" BETWEEN 0 AND 100),
        "active"       boolean NOT NULL DEFAULT true,
        "created_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_memberships_customer_id" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE,
        CONSTRAINT "ck_memberships_range" CHECK ("ends_at" > "starts_at")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_memberships_customer_id_active" ON "memberships" ("customer_id","active")`,
    );

    // -------- INVENTORY ----------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "inventory_products" (
        "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "sku"              varchar(64) UNIQUE NOT NULL,
        "name"             varchar(120) NOT NULL,
        "cost_cents"       int NOT NULL CHECK ("cost_cents" >= 0),
        "sale_price_cents" int NOT NULL CHECK ("sale_price_cents" >= 0),
        "stock"            int NOT NULL DEFAULT 0 CHECK ("stock" >= 0),
        "min_stock"        int NOT NULL DEFAULT 0 CHECK ("min_stock" >= 0),
        "active"           boolean NOT NULL DEFAULT true,
        "created_at"       timestamptz NOT NULL DEFAULT now(),
        "updated_at"       timestamptz NOT NULL DEFAULT now(),
        "deleted_at"       timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "inventory_movements" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "product_id"  uuid NOT NULL,
        "type"        varchar(8) NOT NULL CHECK ("type" IN ('IN','OUT','ADJUST')),
        "qty"         int NOT NULL,
        "reason"      varchar(255),
        "ref_type"    varchar(32),
        "ref_id"      uuid,
        "created_by"  uuid,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_inventory_movements_product_id" FOREIGN KEY ("product_id") REFERENCES "inventory_products" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_inventory_movements_product_id_created_at" ON "inventory_movements" ("product_id","created_at")`,
    );

    // -------- APPOINTMENTS -------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "customer_id"    uuid NOT NULL,
        "barber_id"      uuid NOT NULL,
        "scheduled_at"   timestamptz NOT NULL,
        "ends_at"        timestamptz NOT NULL,
        "status"         varchar(16) NOT NULL DEFAULT 'BOOKED'
          CHECK ("status" IN ('BOOKED','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW')),
        "source"         varchar(16) NOT NULL DEFAULT 'WEB'
          CHECK ("source" IN ('WEB','PHONE','WALKIN','ADMIN')),
        "notes"          text,
        "created_by"     uuid,
        "cancelled_at"   timestamptz,
        "cancel_reason"  varchar(255),
        "created_at"     timestamptz NOT NULL DEFAULT now(),
        "updated_at"     timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_appointments_customer_id" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_appointments_barber_id"   FOREIGN KEY ("barber_id")   REFERENCES "barbers"   ("id") ON DELETE RESTRICT,
        CONSTRAINT "ck_appointments_range" CHECK ("ends_at" > "scheduled_at")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_appointments_barber_id_scheduled_at" ON "appointments" ("barber_id","scheduled_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_appointments_customer_id_scheduled_at" ON "appointments" ("customer_id","scheduled_at")`,
    );

    // ANTI DOBLE-BOOKING: exclusión por solapamiento de rangos en mismo barbero,
    // ignorando citas canceladas. tstzrange con intervalo [scheduled_at, ends_at).
    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "ex_appointments_no_overlap"
      EXCLUDE USING gist (
        "barber_id" WITH =,
        tstzrange("scheduled_at", "ends_at", '[)') WITH &&
      ) WHERE ("status" NOT IN ('CANCELLED','NO_SHOW'))
    `);

    await queryRunner.query(`
      CREATE TABLE "appointment_items" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "appointment_id"  uuid NOT NULL,
        "service_id"      uuid NOT NULL,
        "price_cents"     int NOT NULL CHECK ("price_cents" >= 0),
        "duration_min"    int NOT NULL CHECK ("duration_min" > 0),
        CONSTRAINT "fk_appointment_items_appointment_id" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_appointment_items_service_id"     FOREIGN KEY ("service_id")     REFERENCES "services"     ("id") ON DELETE RESTRICT
      )
    `);

    // -------- SALES (POS) --------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "sales" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "customer_id"     uuid,
        "barber_id"       uuid,
        "appointment_id"  uuid UNIQUE,
        "subtotal_cents"  int NOT NULL DEFAULT 0 CHECK ("subtotal_cents" >= 0),
        "discount_cents"  int NOT NULL DEFAULT 0 CHECK ("discount_cents" >= 0),
        "tax_cents"       int NOT NULL DEFAULT 0 CHECK ("tax_cents" >= 0),
        "total_cents"     int NOT NULL DEFAULT 0 CHECK ("total_cents" >= 0),
        "status"          varchar(16) NOT NULL DEFAULT 'OPEN'
          CHECK ("status" IN ('OPEN','CLOSED','VOIDED')),
        "closed_at"       timestamptz,
        "closed_by"       uuid,
        "created_by"      uuid,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_sales_customer_id"    FOREIGN KEY ("customer_id")    REFERENCES "customers"    ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_sales_barber_id"      FOREIGN KEY ("barber_id")      REFERENCES "barbers"      ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_sales_appointment_id" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_sales_status_created_at" ON "sales" ("status","created_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "sale_items" (
        "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "sale_id"          uuid NOT NULL,
        "kind"             varchar(8) NOT NULL CHECK ("kind" IN ('SERVICE','PRODUCT')),
        "service_id"       uuid,
        "product_id"       uuid,
        "qty"              int NOT NULL CHECK ("qty" > 0),
        "unit_price_cents" int NOT NULL CHECK ("unit_price_cents" >= 0),
        "total_cents"      int NOT NULL CHECK ("total_cents" >= 0),
        CONSTRAINT "fk_sale_items_sale_id"    FOREIGN KEY ("sale_id")    REFERENCES "sales"              ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sale_items_service_id" FOREIGN KEY ("service_id") REFERENCES "services"           ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_sale_items_product_id" FOREIGN KEY ("product_id") REFERENCES "inventory_products" ("id") ON DELETE RESTRICT,
        CONSTRAINT "ck_sale_items_kind_ref" CHECK (
          ("kind" = 'SERVICE' AND "service_id" IS NOT NULL AND "product_id" IS NULL) OR
          ("kind" = 'PRODUCT' AND "product_id" IS NOT NULL AND "service_id" IS NULL)
        )
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "sale_id"       uuid NOT NULL,
        "method"        varchar(16) NOT NULL CHECK ("method" IN ('CASH','CARD','TRANSFER','YAPE','PLIN','OTHER')),
        "amount_cents"  int NOT NULL CHECK ("amount_cents" > 0),
        "reference"     varchar(255),
        "paid_at"       timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_payments_sale_id" FOREIGN KEY ("sale_id") REFERENCES "sales" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "ix_payments_sale_id" ON "payments" ("sale_id")`);

    // -------- REVIEWS ------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "appointment_id" uuid UNIQUE NOT NULL,
        "customer_id"    uuid NOT NULL,
        "barber_id"      uuid NOT NULL,
        "rating"         smallint NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
        "comment"        text,
        "created_at"     timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_reviews_appointment_id" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_reviews_customer_id"    FOREIGN KEY ("customer_id")    REFERENCES "customers"    ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_reviews_barber_id"      FOREIGN KEY ("barber_id")      REFERENCES "barbers"      ("id") ON DELETE RESTRICT
      )
    `);

    // -------- SETTINGS -----------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "settings" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "key"         varchar(64) UNIQUE NOT NULL,
        "value"       jsonb NOT NULL,
        "updated_by"  uuid,
        "updated_at"  timestamptz NOT NULL DEFAULT now()
      )
    `);

    // -------- NOTIFICATION LOGS -------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "notification_logs" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "channel"     varchar(16) NOT NULL CHECK ("channel" IN ('EMAIL','WHATSAPP','SMS')),
        "recipient"   varchar(255) NOT NULL,
        "template"    varchar(64) NOT NULL,
        "payload"     jsonb NOT NULL DEFAULT '{}'::jsonb,
        "status"      varchar(16) NOT NULL DEFAULT 'PENDING'
          CHECK ("status" IN ('PENDING','SENT','FAILED')),
        "error"       text,
        "sent_at"     timestamptz,
        "created_at"  timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_notification_logs_status_created_at" ON "notification_logs" ("status","created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sale_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sales"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appointment_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inventory_movements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inventory_products"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "memberships"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_promotions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "barber_blocks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "barber_schedules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "barbers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers"`);
  }
}
