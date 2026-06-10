import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Geofence, GeofenceEvent } from '@app/database';
import { AdsbmasGateway } from '../gateway/adsbmas.gateway.js';

@Injectable()
export class GeofenceService implements OnModuleInit {
  private geofences: Geofence[] = [];
  // Tracks containment status: icao24 -> Set of active geofence_ids
  private readonly containmentMap = new Map<string, Set<string>>();

  constructor(
    @InjectRepository(Geofence)
    private readonly geofenceRepo: Repository<Geofence>,
    @InjectRepository(GeofenceEvent)
    private readonly eventRepo: Repository<GeofenceEvent>,
    private readonly gateway: AdsbmasGateway,
  ) {}

  async onModuleInit() {
    await this.loadGeofences();
  }

  async loadGeofences() {
    this.geofences = await this.geofenceRepo.find({ where: { is_active: true } });
    console.log(`Loaded ${this.geofences.length} active geofences into cache.`);
  }

  async createGeofence(name: string, description: string | null, polygonGeoJson: any): Promise<Geofence> {
    const geofence = new Geofence();
    geofence.name = name;
    geofence.description = description;
    geofence.polygon_geojson = polygonGeoJson;
    geofence.alert_on_enter = true;
    geofence.alert_on_exit = true;
    geofence.is_active = true;
    
    const saved = await this.geofenceRepo.save(geofence);
    await this.loadGeofences(); // Refresh cache
    return saved;
  }

  async getAllGeofences(): Promise<Geofence[]> {
    return this.geofenceRepo.find();
  }

  async getEvents(): Promise<GeofenceEvent[]> {
    return this.eventRepo.find({
      order: { occurred_at: 'DESC' },
      take: 100,
    });
  }

  /**
   * Evaluates if aircraft coordinates trigger enter/exit boundary events
   */
  async checkAircraft(aircraft: {
    icao24: string;
    callsign?: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    velocity?: number;
    heading?: number;
  }) {
    const { icao24, latitude, longitude } = aircraft;
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return;
    }

    if (!this.containmentMap.has(icao24)) {
      this.containmentMap.set(icao24, new Set<string>());
    }
    const currentZones = this.containmentMap.get(icao24)!;

    for (const geofence of this.geofences) {
      let coords = geofence.polygon_geojson;
      // Handle standard GeoJSON geometry wrappers
      if (coords && coords.geometry && coords.geometry.coordinates) {
        coords = coords.geometry.coordinates;
      } else if (coords && coords.coordinates) {
        coords = coords.coordinates;
      }

      if (!Array.isArray(coords)) {
        continue;
      }

      const isInside = this.isPointInPolygon([longitude, latitude], coords);
      const wasInside = currentZones.has(geofence.id);

      if (isInside && !wasInside) {
        currentZones.add(geofence.id);
        await this.handleEvent(geofence, aircraft, 'ENTER');
      } else if (!isInside && wasInside) {
        currentZones.delete(geofence.id);
        await this.handleEvent(geofence, aircraft, 'EXIT');
      }
    }
  }

  /**
   * Fast zero-dependency Ray-Casting algorithm for point-in-polygon check.
   * point: [lng, lat]
   * polygon: array of rings, each ring is an array of [lng, lat]
   */
  private isPointInPolygon(point: [number, number], polygon: any[]): boolean {
    if (!polygon || polygon.length === 0) return false;
    
    // Support coordinate formatting of outer boundaries
    let ring = polygon[0];
    if (!Array.isArray(ring)) return false;

    // Handle nested arrays if GeoJSON Polygon coordinates were nested too deep
    if (Array.isArray(ring[0]) && Array.isArray(ring[0][0])) {
      ring = ring[0];
    }

    const x = point[0]; // longitude
    const y = point[1]; // latitude
    let inside = false;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  }

  private async handleEvent(geofence: Geofence, aircraft: any, eventType: 'ENTER' | 'EXIT') {
    try {
      const event = new GeofenceEvent();
      event.geofence_id = geofence.id;
      event.icao24 = aircraft.icao24;
      event.callsign = aircraft.callsign || null;
      event.event_type = eventType;
      event.occurred_at = new Date();
      
      const saved = await this.eventRepo.save(event);

      // Broadcast alert through Websocket
      this.gateway.broadcastAlert({
        event_id: saved.id,
        geofence_id: geofence.id,
        geofence_name: geofence.name,
        icao24: aircraft.icao24,
        callsign: aircraft.callsign || 'N/A',
        event_type: eventType,
        occurred_at: event.occurred_at.toISOString(),
        altitude: aircraft.altitude ?? null,
        velocity: aircraft.velocity ?? null,
      });

      console.log(`Geofence Alert [${eventType}]: Aircraft ${aircraft.icao24} (${aircraft.callsign || 'N/A'}) crossed zone '${geofence.name}'`);
    } catch (err) {
      console.error('Failed to log geofence event:', err);
    }
  }
}
