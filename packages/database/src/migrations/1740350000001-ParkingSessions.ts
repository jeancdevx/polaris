import type { MigrationInterface, QueryRunner } from 'typeorm'

export class ParkingSessions1740350000001 implements MigrationInterface {
  name = 'ParkingSessions1740350000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "parking_sessions" (
        "session_id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "rfid_uid" varchar(17) NOT NULL,
        "user_id" varchar(32),
        "vehicle_plate" varchar(16),
        "status" varchar(20) NOT NULL,
        "entry_at" TIMESTAMPTZ NOT NULL,
        "exit_at" TIMESTAMPTZ,
        CONSTRAINT "PK_parking_sessions" PRIMARY KEY ("session_id"),
        CONSTRAINT "CHK_parking_sessions_status" CHECK ("status" IN ('open', 'closed')),
        CONSTRAINT "FK_parking_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL
      )
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_parking_sessions_rfid_open"
      ON "parking_sessions" ("rfid_uid")
      WHERE "status" = 'open'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_parking_sessions_rfid_open"`)
    await queryRunner.query(`DROP TABLE "parking_sessions"`)
  }
}
