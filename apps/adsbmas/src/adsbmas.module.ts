import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { AuthModule } from '@app/auth';

import { AdsbmasController } from './adsbmas.controller.js';
import { AdsbmasService } from './adsbmas.service.js';

import { GatewayModule } from './gateway/gateway.module.js';
import { GeofenceModule } from './geofence/geofence.module.js';
import { PlaybackModule } from './playback/playback.module.js';
import { TrackingModule } from './tracking/tracking.module.js';
import { AdsbIngestionModule } from './ingestion/adsb-ingestion.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    GatewayModule,
    GeofenceModule,
    PlaybackModule,
    TrackingModule,
    AdsbIngestionModule,
  ],
  controllers: [AdsbmasController],
  providers: [AdsbmasService],
})
export class AdsbmasModule {}
