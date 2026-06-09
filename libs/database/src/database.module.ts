import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service.js';
import { User } from '@app/users';
import {
  Station,
  SensorReading,
  SensorAlert,
  SyncQueue,
  Camera,
  CameraSnapshot,
  Aircraft,
  AircraftTrack,
  Geofence,
  GeofenceEvent,
  DeviceNode,
  AlertRule,
} from './entities/index.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST') ?? 'localhost',
        port: configService.get<number>('DATABASE_PORT') ?? 5432,
        username: configService.get<string>('DATABASE_USER') ?? 'postgres',
        password: configService.get<string>('DATABASE_PASSWORD') ?? 'postgres',
        database: configService.get<string>('DATABASE_NAME') ?? 'postgres',
        entities: [
          User,
          Station,
          SensorReading,
          SensorAlert,
          SyncQueue,
          Camera,
          CameraSnapshot,
          Aircraft,
          AircraftTrack,
          Geofence,
          GeofenceEvent,
          DeviceNode,
          AlertRule,
        ],
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService, TypeOrmModule],
})
export class DatabaseModule {}
