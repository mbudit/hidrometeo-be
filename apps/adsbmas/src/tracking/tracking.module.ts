import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aircraft, AircraftTrack } from '@app/database';
import { TrackingService } from './tracking.service.js';
import { AircraftController } from './aircraft.controller.js';
import { GatewayModule } from '../gateway/gateway.module.js';
import { GeofenceModule } from '../geofence/geofence.module.js';
import { PlaybackModule } from '../playback/playback.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Aircraft, AircraftTrack]),
    GatewayModule,
    GeofenceModule,
    PlaybackModule,
  ],
  controllers: [AircraftController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
