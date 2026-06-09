import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizeADSB1781074719000 implements MigrationInterface {
  name = 'OptimizeADSB1781074719000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create aircraft table
    await queryRunner.query(`
      CREATE TABLE "aircraft" (
        "icao24" character varying(6) NOT NULL,
        "registration" character varying(12),
        "type_code" character varying(4),
        "model" character varying(100),
        "country" character varying(50),
        "country_code" character varying(2),
        "is_military" boolean NOT NULL DEFAULT false,
        "first_seen" timestamp with time zone NOT NULL DEFAULT now(),
        "last_seen" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_aircraft_icao24" PRIMARY KEY ("icao24")
      )
    `);

    // 2. Alter aircraft_tracks table to add new columns
    await queryRunner.query(`
      ALTER TABLE "aircraft_tracks" 
      ADD COLUMN IF NOT EXISTS "vertical_rate" double precision,
      ADD COLUMN IF NOT EXISTS "distance" double precision,
      ADD COLUMN IF NOT EXISTS "uploaded" boolean DEFAULT false
    `);

    // 3. Optimize data types of existing columns in aircraft_tracks
    await queryRunner.query(`
      ALTER TABLE "aircraft_tracks" ALTER COLUMN "icao24" TYPE character varying(6);
      ALTER TABLE "aircraft_tracks" ALTER COLUMN "squawk" TYPE character varying(4);
      ALTER TABLE "aircraft_tracks" ALTER COLUMN "callsign" TYPE character varying(8);
    `);

    // 4. Create dummy entries in aircraft table for any pre-existing tracks to preserve foreign key constraint
    await queryRunner.query(`
      INSERT INTO "aircraft" ("icao24", "country", "is_military")
      SELECT DISTINCT "icao24", 'Unknown', false 
      FROM "aircraft_tracks"
      ON CONFLICT ("icao24") DO NOTHING
    `);

    // 5. Add foreign key constraint linking aircraft_tracks to aircraft table
    await queryRunner.query(`
      ALTER TABLE "aircraft_tracks" 
      ADD CONSTRAINT "FK_aircraft_tracks_aircraft" 
      FOREIGN KEY ("icao24") REFERENCES "aircraft"("icao24") ON DELETE CASCADE
    `);

    // 6. Create partial index for the uploader
    await queryRunner.query(`
      CREATE INDEX "IDX_aircraft_tracks_unsent" 
      ON "aircraft_tracks" ("time") 
      WHERE ("uploaded" = false OR "uploaded" IS NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes and constraints
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_aircraft_tracks_unsent"`);
    await queryRunner.query(`
      ALTER TABLE "aircraft_tracks" 
      DROP CONSTRAINT IF EXISTS "FK_aircraft_tracks_aircraft"
    `);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "aircraft_tracks" 
      DROP COLUMN IF EXISTS "vertical_rate",
      DROP COLUMN IF EXISTS "distance",
      DROP COLUMN IF EXISTS "uploaded"
    `);

    // Restore column sizes if needed
    await queryRunner.query(`
      ALTER TABLE "aircraft_tracks" ALTER COLUMN "icao24" TYPE character varying;
      ALTER TABLE "aircraft_tracks" ALTER COLUMN "squawk" TYPE character varying;
      ALTER TABLE "aircraft_tracks" ALTER COLUMN "callsign" TYPE character varying;
    `);

    // Drop aircraft table
    await queryRunner.query(`DROP TABLE IF EXISTS "aircraft"`);
  }
}
