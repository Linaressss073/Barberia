import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditLogs1714000100000 implements MigrationInterface {
  name = 'AuditLogs1714000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"     uuid,
        "action"      varchar(64) NOT NULL,
        "entity"      varchar(64) NOT NULL,
        "entity_id"   varchar(64),
        "before"      jsonb,
        "after"       jsonb,
        "ip"          varchar(45),
        "user_agent"  varchar(256),
        "request_id"  varchar(64),
        "created_at"  timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "ix_audit_logs_user_id" ON "audit_logs" ("user_id")`);
    await queryRunner.query(
      `CREATE INDEX "ix_audit_logs_entity" ON "audit_logs" ("entity","entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_audit_logs_created_at" ON "audit_logs" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
