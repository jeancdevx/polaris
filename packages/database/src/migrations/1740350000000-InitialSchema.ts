import type { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1740350000000 implements MigrationInterface {
  name = 'InitialSchema1740350000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "user_id" varchar(32) NOT NULL,
        "name" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL,
        "vehicle_plate" varchar(16) NOT NULL,
        "rfid_uid" varchar(17) NOT NULL,
        "user_type" varchar(20) NOT NULL DEFAULT 'registered',
        "role" varchar(20) NOT NULL DEFAULT 'user',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("user_id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_rfid_uid" UNIQUE ("rfid_uid"),
        CONSTRAINT "CHK_users_user_type" CHECK ("user_type" IN ('registered', 'visitor')),
        CONSTRAINT "CHK_users_role" CHECK ("role" IN ('user', 'admin'))
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "parking_spots" (
        "spot_id" varchar(16) NOT NULL,
        "zone" char(1) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'free',
        "reservation_id" varchar(32),
        "user_id" varchar(32),
        "occupied_since" TIMESTAMPTZ,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_parking_spots" PRIMARY KEY ("spot_id"),
        CONSTRAINT "CHK_parking_spots_status" CHECK ("status" IN ('free', 'occupied', 'reserved')),
        CONSTRAINT "CHK_parking_spots_zone" CHECK ("zone" IN ('a', 'b')),
        CONSTRAINT "FK_parking_spots_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "reservations" (
        "reservation_id" varchar(32) NOT NULL,
        "user_id" varchar(32) NOT NULL,
        "parking_spot_id" varchar(16) NOT NULL,
        "status" varchar(20) NOT NULL,
        "reservation_date" TIMESTAMPTZ NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "checked_in_at" TIMESTAMPTZ,
        "checked_out_at" TIMESTAMPTZ,
        "cancelled_at" TIMESTAMPTZ,
        "expired_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reservations" PRIMARY KEY ("reservation_id"),
        CONSTRAINT "CHK_reservations_status" CHECK (
          "status" IN ('active', 'checked_in', 'completed', 'cancelled', 'expired')
        ),
        CONSTRAINT "FK_reservations_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE,
        CONSTRAINT "FK_reservations_parking_spot" FOREIGN KEY ("parking_spot_id") REFERENCES "parking_spots"("spot_id") ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "rfid_tags" (
        "rfid_uid" varchar(17) NOT NULL,
        "user_id" varchar(32) NOT NULL,
        "user_type" varchar(20) NOT NULL DEFAULT 'registered',
        "vehicle_plate" varchar(16) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "valid_until" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rfid_tags" PRIMARY KEY ("rfid_uid"),
        CONSTRAINT "CHK_rfid_tags_user_type" CHECK ("user_type" IN ('registered', 'visitor')),
        CONSTRAINT "FK_rfid_tags_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "log_id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event_type" varchar(100) NOT NULL,
        "user_id" varchar(32),
        "user_type" varchar(20),
        "vehicle_plate" varchar(16),
        "parking_spot_id" varchar(16),
        "gate" varchar(50),
        "metadata" jsonb,
        "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("log_id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "sensor_data" (
        "id" BIGSERIAL NOT NULL,
        "sensor_id" varchar(64) NOT NULL,
        "sensor_type" varchar(50) NOT NULL,
        "value" jsonb NOT NULL,
        "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sensor_data" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_reservations_user_id" ON "reservations" ("user_id")
    `)
    await queryRunner.query(`
      CREATE INDEX "IDX_reservations_parking_spot_id" ON "reservations" ("parking_spot_id")
    `)
    await queryRunner.query(`
      CREATE INDEX "IDX_reservations_status" ON "reservations" ("status")
    `)
    await queryRunner.query(`
      CREATE INDEX "IDX_reservations_expires_at" ON "reservations" ("expires_at")
    `)
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_timestamp" ON "audit_logs" ("timestamp")
    `)
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_event_type" ON "audit_logs" ("event_type")
    `)
    await queryRunner.query(`
      CREATE INDEX "IDX_sensor_data_sensor_id" ON "sensor_data" ("sensor_id")
    `)
    await queryRunner.query(`
      CREATE INDEX "IDX_sensor_data_recorded_at" ON "sensor_data" ("recorded_at")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_sensor_data_recorded_at"`)
    await queryRunner.query(`DROP INDEX "IDX_sensor_data_sensor_id"`)
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_event_type"`)
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_timestamp"`)
    await queryRunner.query(`DROP INDEX "IDX_reservations_expires_at"`)
    await queryRunner.query(`DROP INDEX "IDX_reservations_status"`)
    await queryRunner.query(`DROP INDEX "IDX_reservations_parking_spot_id"`)
    await queryRunner.query(`DROP INDEX "IDX_reservations_user_id"`)
    await queryRunner.query(`DROP TABLE "sensor_data"`)
    await queryRunner.query(`DROP TABLE "audit_logs"`)
    await queryRunner.query(`DROP TABLE "rfid_tags"`)
    await queryRunner.query(`DROP TABLE "reservations"`)
    await queryRunner.query(`DROP TABLE "parking_spots"`)
    await queryRunner.query(`DROP TABLE "users"`)
  }
}
