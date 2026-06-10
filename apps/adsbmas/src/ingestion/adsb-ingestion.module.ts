import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdsbIngestionService } from './adsb-ingestion.service.js';
import { TrackingModule } from '../tracking/tracking.module.js';

@Module({
  imports: [ConfigModule, TrackingModule],
  providers: [AdsbIngestionService],
})
export class AdsbIngestionModule {}
