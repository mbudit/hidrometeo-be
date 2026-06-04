import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1780587140000 implements MigrationInterface {
  name = 'InitialSchema1780587140000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "name" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'viewer',
        "software_access" text NOT NULL DEFAULT '',
        "refresh_token_hash" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    // Create stations table
    await queryRunner.query(`
      CREATE TABLE "stations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "kecamatan" character varying,
        "kelurahan" character varying,
        "lat" double precision NOT NULL,
        "lng" double precision NOT NULL,
        "elevation" double precision,
        "status" character varying NOT NULL,
        "last_seen_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_stations_code" UNIQUE ("code"),
        CONSTRAINT "PK_stations_id" PRIMARY KEY ("id")
      )
    `);

    // Create sensor_readings table
    await queryRunner.query(`
      CREATE TABLE "sensor_readings" (
        "time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "station_id" uuid NOT NULL,
        "temperature" double precision,
        "humidity" double precision,
        "rainfall" double precision,
        "wind_speed" double precision,
        "wind_direction" double precision,
        "pressure" double precision,
        "battery_voltage" double precision,
        CONSTRAINT "PK_sensor_readings" PRIMARY KEY ("time", "station_id")
      )
    `);

    // Add foreign key constraint for sensor_readings
    await queryRunner.query(`
      ALTER TABLE "sensor_readings" 
      ADD CONSTRAINT "FK_sensor_readings_station" 
      FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE CASCADE
    `);

    // Create sensor_alerts table
    await queryRunner.query(`
      CREATE TABLE "sensor_alerts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "station_id" uuid NOT NULL,
        "parameter" character varying NOT NULL,
        "value" double precision NOT NULL,
        "threshold" double precision NOT NULL,
        "severity" character varying NOT NULL,
        "triggered_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_sensor_alerts" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraint for sensor_alerts
    await queryRunner.query(`
      ALTER TABLE "sensor_alerts" 
      ADD CONSTRAINT "FK_sensor_alerts_station" 
      FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE CASCADE
    `);

    // Create sync_queues table
    await queryRunner.query(`
      CREATE TABLE "sync_queues" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "station_id" uuid,
        "payload" jsonb NOT NULL,
        "attempt_count" integer NOT NULL DEFAULT 0,
        "last_attempt_at" TIMESTAMP WITH TIME ZONE,
        "status" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_sync_queues" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraint for sync_queues
    await queryRunner.query(`
      ALTER TABLE "sync_queues" 
      ADD CONSTRAINT "FK_sync_queues_station" 
      FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE SET NULL
    `);

    // Create cameras table
    await queryRunner.query(`
      CREATE TABLE "cameras" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "kecamatan" character varying,
        "lat" double precision NOT NULL,
        "lng" double precision NOT NULL,
        "stream_url" character varying NOT NULL,
        "type" character varying NOT NULL,
        "status" character varying NOT NULL,
        "last_checked_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_cameras_code" UNIQUE ("code"),
        CONSTRAINT "PK_cameras" PRIMARY KEY ("id")
      )
    `);

    // Create camera_snapshots table
    await queryRunner.query(`
      CREATE TABLE "camera_snapshots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "camera_id" uuid NOT NULL,
        "file_path" character varying NOT NULL,
        "captured_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "triggered_by" character varying NOT NULL,
        CONSTRAINT "PK_camera_snapshots" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraint for camera_snapshots
    await queryRunner.query(`
      ALTER TABLE "camera_snapshots" 
      ADD CONSTRAINT "FK_camera_snapshots_camera" 
      FOREIGN KEY ("camera_id") REFERENCES "cameras"("id") ON DELETE CASCADE
    `);

    // Create aircraft_tracks table
    await queryRunner.query(`
      CREATE TABLE "aircraft_tracks" (
        "time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "icao24" character varying NOT NULL,
        "callsign" character varying,
        "lat" double precision NOT NULL,
        "lng" double precision NOT NULL,
        "altitude" double precision,
        "velocity" double precision,
        "heading" double precision,
        "squawk" character varying,
        CONSTRAINT "PK_aircraft_tracks" PRIMARY KEY ("time", "icao24")
      )
    `);

    // Create geofences table
    await queryRunner.query(`
      CREATE TABLE "geofences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "polygon_geojson" jsonb NOT NULL,
        "alert_on_enter" boolean NOT NULL DEFAULT false,
        "alert_on_exit" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_geofences" PRIMARY KEY ("id")
      )
    `);

    // Create geofence_events table
    await queryRunner.query(`
      CREATE TABLE "geofence_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "geofence_id" uuid NOT NULL,
        "icao24" character varying NOT NULL,
        "callsign" character varying,
        "event_type" character varying NOT NULL,
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_geofence_events" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraint for geofence_events
    await queryRunner.query(`
      ALTER TABLE "geofence_events" 
      ADD CONSTRAINT "FK_geofence_events_geofence" 
      FOREIGN KEY ("geofence_id") REFERENCES "geofences"("id") ON DELETE CASCADE
    `);

    // Create device_nodes table
    await queryRunner.query(`
      CREATE TABLE "device_nodes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "hostname" character varying NOT NULL,
        "ip" character varying NOT NULL,
        "type" character varying NOT NULL,
        "location" character varying,
        "prometheus_job" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_device_nodes" PRIMARY KEY ("id")
      )
    `);

    // Create alert_rules table
    await queryRunner.query(`
      CREATE TABLE "alert_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "node_id" uuid,
        "metric" character varying NOT NULL,
        "operator" character varying NOT NULL,
        "threshold" double precision NOT NULL,
        "severity" character varying NOT NULL,
        "notify_channels" text[] NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_alert_rules" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraint for alert_rules
    await queryRunner.query(`
      ALTER TABLE "alert_rules" 
      ADD CONSTRAINT "FK_alert_rules_device_node" 
      FOREIGN KEY ("node_id") REFERENCES "device_nodes"("id") ON DELETE SET NULL
    `);

    // --- TimescaleDB Hypertable conversion ---
    await queryRunner.query(
      `SELECT create_hypertable('sensor_readings', 'time')`,
    );
    await queryRunner.query(
      `SELECT create_hypertable('aircraft_tracks', 'time')`,
    );

    // --- Create requested indexes ---
    await queryRunner.query(`
      CREATE INDEX "IDX_sensor_readings_station_time" 
      ON "sensor_readings" ("station_id", "time")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_aircraft_tracks_icao24_time" 
      ON "aircraft_tracks" ("icao24", "time")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order to avoid FK constraint issues
    await queryRunner.query(`DROP TABLE IF EXISTS "alert_rules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "device_nodes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "geofence_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "geofences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "aircraft_tracks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "camera_snapshots"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cameras"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sync_queues"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sensor_alerts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sensor_readings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
