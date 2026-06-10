import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TrackingService } from './tracking.service.js';
import { PlaybackService } from '../playback/playback.service.js';
import { JwtAuthGuard } from '@app/auth';

@Controller('aircraft')
@UseGuards(JwtAuthGuard)
export class AircraftController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly playbackService: PlaybackService,
  ) {}

  @Get('live')
  async getLiveAircraft() {
    return this.trackingService.getActiveAircraft();
  }

  @Get(':icao24')
  async getAircraftDetails(@Param('icao24') icao24: string) {
    return this.trackingService.getAircraftDetails(icao24);
  }

  @Get(':icao24/history')
  async getAircraftHistory(
    @Param('icao24') icao24: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 3600000); // Default 1 hour ago
    const toDate = to ? new Date(to) : new Date(); // Default now
    return this.playbackService.getHistory(icao24, fromDate, toDate);
  }
}
