import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Geofence, GeofenceEvent } from '@app/database';
import { GeofenceService } from './geofence.service.js';
import { GeofenceController } from './geofence.controller.js';
import { GatewayModule } from '../gateway/gateway.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Geofence, GeofenceEvent]),
    GatewayModule,
  ],
  controllers: [GeofenceController],
  providers: [GeofenceService],
  exports: [GeofenceService],
})
export class GeofenceModule {}
