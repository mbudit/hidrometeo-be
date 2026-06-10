import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { GeofenceService } from './geofence.service.js';
import { JwtAuthGuard } from '@app/auth';

@Controller('geofences')
@UseGuards(JwtAuthGuard)
export class GeofenceController {
  constructor(private readonly geofenceService: GeofenceService) {}

  @Get()
  async getGeofences() {
    return this.geofenceService.getAllGeofences();
  }

  @Post()
  async createGeofence(
    @Body('name') name: string,
    @Body('description') description: string | null,
    @Body('polygon') polygon: any,
  ) {
    return this.geofenceService.createGeofence(name, description, polygon);
  }

  @Get('events')
  async getEvents() {
    return this.geofenceService.getEvents();
  }
}
