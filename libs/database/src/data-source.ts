import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../../users/src/user.entity.js';
import {
  Station,
  SensorReading,
  SensorAlert,
  SyncQueue,
  Camera,
  CameraSnapshot,
  AircraftTrack,
  Geofence,
  GeofenceEvent,
  DeviceNode,
  AlertRule,
} from './entities/index.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'postgres',
  entities: [
    User,
    Station,
    SensorReading,
    SensorAlert,
    SyncQueue,
    Camera,
    CameraSnapshot,
    AircraftTrack,
    Geofence,
    GeofenceEvent,
    DeviceNode,
    AlertRule,
  ],
  migrations: ['libs/database/src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});
