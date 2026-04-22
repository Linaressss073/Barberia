import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración inicial.
 * - Habilita extensiones pgcrypto (gen_random_uuid) y btree_gist (exclusión temporal en appointments).
 * - Crea tablas: users, refresh_tokens.
 * - Esquema base sobre el que se irán acumulando migraciones por módulo.
 */
export class InitialSchema1714000000000 implements MigrationInterface {
  name = 'InitialSchema1714000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"         varchar(254) NOT NULL,
        "full_name"     varchar(120) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "status"        varchar(16)  NOT NULL DEFAULT 'ACTIVE',
        "roles"         varchar[]    NOT NULL DEFAULT '{}',
        "last_login_at" timestamptz,
        "created_at"    timestamptz  NOT NULL DEFAULT now(),
        "updated_at"    timestamptz  NOT NULL DEFAULT now(),
        "deleted_at"    timestamptz,
        CONSTRAINT "ck_users_status" CHECK ("status" IN ('ACTIVE','DISABLED','PENDING'))
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_email" ON "users" ("email") WHERE "deleted_at" IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"     uuid NOT NULL,
        "token_hash"  varchar(128) NOT NULL,
        "expires_at"  timestamptz  NOT NULL,
        "revoked_at"  timestamptz,
        "created_at"  timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "fk_refresh_tokens_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "jwt_denylist" (
        "jti"        varchar(64)  PRIMARY KEY,
        "expires_at" timestamptz  NOT NULL,
        "created_at" timestamptz  NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_jwt_denylist_expires_at" ON "jwt_denylist" ("expires_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "jwt_denylist"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
