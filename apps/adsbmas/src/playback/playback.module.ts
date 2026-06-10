import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AircraftTrack } from '@app/database';
import { PlaybackService } from './playback.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([AircraftTrack])],
  providers: [PlaybackService],
  exports: [PlaybackService],
})
export class PlaybackModule {}
