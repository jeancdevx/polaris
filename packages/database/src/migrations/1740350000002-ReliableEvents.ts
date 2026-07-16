import type { MigrationInterface, QueryRunner } from 'typeorm'

export class ReliableEvents1740350000002 implements MigrationInterface {
  name = 'ReliableEvents1740350000002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "outbox_events" (
        "event_id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "topic" varchar(128) NOT NULL,
        "partition_key" varchar(128) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "attempts" integer NOT NULL DEFAULT 0,
        "available_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "locked_at" TIMESTAMPTZ,
        "published_at" TIMESTAMPTZ,
        "last_error" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_outbox_events" PRIMARY KEY ("event_id"),
        CONSTRAINT "CHK_outbox_events_status" CHECK ("status" IN ('pending', 'processing', 'published', 'failed'))
      )
    `)
    await queryRunner.query(`
      CREATE INDEX "IDX_outbox_events_dispatch"
      ON "outbox_events" ("status", "available_at", "created_at")
    `)
    await queryRunner.query(`
      CREATE TABLE "consumed_events" (
        "consumer_name" varchar(128) NOT NULL,
        "event_id" varchar(256) NOT NULL,
        "topic" varchar(128) NOT NULL,
        "partition" integer NOT NULL,
        "offset" varchar(32) NOT NULL,
        "status" varchar(20) NOT NULL,
        "processed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_consumed_events" PRIMARY KEY ("consumer_name", "event_id"),
        CONSTRAINT "CHK_consumed_events_status" CHECK ("status" IN ('processing', 'completed'))
      )
    `)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_reservations_one_active_per_user"
      ON "reservations" ("user_id")
      WHERE "status" = 'active'
    `)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_reservations_one_active_per_spot"
      ON "reservations" ("parking_spot_id")
      WHERE "status" = 'active'
    `)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_parking_sessions_one_open_per_rfid"
      ON "parking_sessions" ("rfid_uid")
      WHERE "status" = 'open'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UQ_parking_sessions_one_open_per_rfid"`
    )
    await queryRunner.query(`DROP INDEX "UQ_reservations_one_active_per_spot"`)
    await queryRunner.query(`DROP INDEX "UQ_reservations_one_active_per_user"`)
    await queryRunner.query(`DROP TABLE "consumed_events"`)
    await queryRunner.query(`DROP INDEX "IDX_outbox_events_dispatch"`)
    await queryRunner.query(`DROP TABLE "outbox_events"`)
  }
}
