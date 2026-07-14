import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aircraft, AircraftTrack } from '@app/database';
import { AdsbmasGateway } from '../gateway/adsbmas.gateway.js';
import { GeofenceService } from '../geofence/geofence.service.js';

export interface AircraftState {
  icao24: string;
  callsign?: string;
  altitude?: number;
  velocity?: number;
  heading?: number;
  latitude?: number;
  longitude?: number;
  vertical_rate?: number;
  squawk?: string;
  distance?: number;
  lastSeen: number;
  registration?: string;
  model?: string;
  type_code?: string;
  country?: string;
  country_code?: string;
}

@Injectable()
export class TrackingService implements OnModuleInit, OnModuleDestroy {
  // In-memory cache of active aircraft
  private readonly activeAircraft = new Map<string, AircraftState>();
  
  // Set of icao24 addresses already confirmed to exist in the database 'aircraft' metadata table
  private readonly knownAircraft = new Set<string>();

  // Buffer of tracks to insert to the database
  private trackBuffer: any[] = [];
  private flushTimer!: NodeJS.Timeout;

  constructor(
    @InjectRepository(Aircraft)
    private readonly aircraftRepo: Repository<Aircraft>,
    @InjectRepository(AircraftTrack)
    private readonly trackRepo: Repository<AircraftTrack>,
    private readonly gateway: AdsbmasGateway,
    private readonly geofenceService: GeofenceService,
  ) {}

  async onModuleInit() {
    // Load existing aircraft to populate knownAircraft cache
    const existing = await this.aircraftRepo.find({ select: ['icao24'] });
    existing.forEach((ac) => this.knownAircraft.add(ac.icao24));
    console.log(`Initialized knownAircraft cache with ${this.knownAircraft.size} entries.`);

    // Start database flush interval (every 5 seconds)
    this.flushTimer = setInterval(() => this.flushTrackBuffer(), 5000);

    // Start stale aircraft garbage collector (every 10 seconds)
    setInterval(() => this.cleanupStaleAircraft(), 10000);
  }

  onModuleDestroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }

  async updateState(icao24: string, update: Partial<AircraftState>) {
    if (!icao24) return;
    const cleanIcao = icao24.trim().toLowerCase();

    let state = this.activeAircraft.get(cleanIcao);
    const prevLat = state?.latitude;
    const prevLng = state?.longitude;
    const prevTime = state?.lastSeen;

    if (!state) {
      state = { icao24: cleanIcao, lastSeen: Date.now() };
      this.activeAircraft.set(cleanIcao, state);
      // Load static metadata (registration, model, country) asynchronously
      this.loadMetadataForState(cleanIcao);
    }

    // Merge properties
    Object.assign(state, update);
    const currentTime = Date.now();
    state.lastSeen = currentTime;

    // Calculate heading & velocity if position moved and attributes are missing
    if (
      update.latitude !== undefined &&
      update.longitude !== undefined &&
      prevLat !== undefined &&
      prevLng !== undefined &&
      prevTime !== undefined
    ) {
      const lat1 = prevLat;
      const lon1 = prevLng;
      const lat2 = update.latitude;
      const lon2 = update.longitude;

      if (lat1 !== lat2 || lon1 !== lon2) {
        // Calculate heading if not directly supplied by receiver
        if (state.heading === undefined || state.heading === null) {
          state.heading = Math.round(this.calculateBearing(lat1, lon1, lat2, lon2));
        }

        // Calculate velocity if not directly supplied by receiver
        if (state.velocity === undefined || state.velocity === null) {
          const distanceKm = this.calculateDistance(lat1, lon1, lat2, lon2);
          const timeHours = (currentTime - prevTime) / 3600000;
          if (timeHours > 0) {
            const speedKnots = (distanceKm * 0.539957) / timeHours; // km to Nautical Miles / hours
            state.velocity = Math.round(speedKnots);
          }
        }
      }
    }

    // Evaluate geofences on position updates
    if (state.latitude !== undefined && state.longitude !== undefined) {
      await this.geofenceService.checkAircraft(state);
    }

    // Push update to WebSockets
    this.gateway.broadcastAircraft(state);

    // Buffer track coordinate point if a position (lat/lng) was resolved
    if (update.latitude !== undefined && update.longitude !== undefined) {
      this.trackBuffer.push({
        time: new Date(currentTime),
        icao24: cleanIcao,
        callsign: state.callsign || null,
        lat: state.latitude,
        lng: state.longitude,
        altitude: state.altitude ?? null,
        velocity: state.velocity ?? null,
        heading: state.heading ?? null,
        vertical_rate: state.vertical_rate ?? null,
        squawk: state.squawk ?? null,
        distance: state.distance ?? null,
      });
    }
  }

  getActiveAircraft(): AircraftState[] {
    return Array.from(this.activeAircraft.values());
  }

  async getAircraftDetails(icao24: string): Promise<any> {
    const cleanIcao = icao24.trim().toLowerCase();
    const metadata = await this.aircraftRepo.findOne({ where: { icao24: cleanIcao } });
    const liveState = this.activeAircraft.get(cleanIcao);

    return {
      icao24: cleanIcao,
      metadata: metadata || null,
      live: liveState || null,
    };
  }

  private async loadMetadataForState(icao24: string) {
    try {
      let metadata = await this.aircraftRepo.findOne({ where: { icao24 } });
      
      // If not in DB, or missing registration, try to fetch from hexdb.io API
      if (!metadata || !metadata.registration) {
        const url = `https://hexdb.io/api/v1/aircraft/${icao24}`;
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json() as any;
            const apiMetadata = {
              registration: data.Registration || null,
              type_code: data.ICAOTypeCode || null,
              model: data.Type || data.Manufacturer || null,
            };
            
            if (metadata) {
              metadata.registration = apiMetadata.registration;
              metadata.type_code = apiMetadata.type_code;
              metadata.model = apiMetadata.model;
              await this.aircraftRepo.save(metadata);
            } else {
              metadata = this.aircraftRepo.create({
                icao24,
                registration: apiMetadata.registration,
                type_code: apiMetadata.type_code,
                model: apiMetadata.model,
                country: 'Unknown',
                is_military: false,
              });
              await this.aircraftRepo.save(metadata);
            }
            console.log(`Tracking: Fetched and cached hexdb.io metadata for ${icao24}: ${apiMetadata.registration}`);
          }
        } catch (apiErr: any) {
          console.warn(`Tracking: Failed to fetch hexdb metadata for ${icao24}: ${apiErr.message}`);
        }
      }

      // If metadata is resolved, apply it to the active tracking state
      if (metadata) {
        const state = this.activeAircraft.get(icao24);
        if (state) {
          state.registration = metadata.registration || undefined;
          state.model = metadata.model || undefined;
          state.type_code = metadata.type_code || undefined;
          state.country = metadata.country || undefined;
          state.country_code = metadata.country_code || undefined;
          
          // Re-broadcast the enriched state immediately via WebSocket
          this.gateway.broadcastAircraft(state);
        }
      }
    } catch (err) {
      console.error(`Tracking: Failed loading metadata for ${icao24}:`, err);
    }
  }

  private async flushTrackBuffer() {
    if (this.trackBuffer.length === 0) return;

    const batch = [...this.trackBuffer];
    this.trackBuffer = [];

    try {
      // 1. Identify unique ICAOs in the batch and ensure they exist in the metadata table
      const uniqueIcaos = Array.from(new Set(batch.map((t) => t.icao24)));
      const newIcaos = uniqueIcaos.filter((icao) => !this.knownAircraft.has(icao));

      if (newIcaos.length > 0) {
        // Upsert new aircraft metadata into DB
        for (const icao of newIcaos) {
          try {
            await this.aircraftRepo
              .createQueryBuilder()
              .insert()
              .values({
                icao24: icao,
                country: 'Unknown',
                is_military: false,
              })
              .onConflict('("icao24") DO NOTHING')
              .execute();

            this.knownAircraft.add(icao);
          } catch (err) {
            console.error(`Failed to upsert aircraft metadata for ${icao}:`, err);
          }
        }
      }

      // 2. Deduplicate tracks in the batch to avoid ON CONFLICT DO UPDATE constraint errors.
      // Postgres does not allow the same row to be updated/affected multiple times in a single INSERT statement.
      const uniqueTracks = new Map<string, any>();
      for (const track of batch) {
        // Use icao24 and timestamp in milliseconds as the unique key
        const key = `${track.icao24}_${track.time.getTime()}`;
        uniqueTracks.set(key, track);
      }
      const deduplicatedBatch = Array.from(uniqueTracks.values());

      // 3. Batch insert coordinates into TimeSeries hypertable
      await this.trackRepo
        .createQueryBuilder()
        .insert()
        .values(deduplicatedBatch)
        .onConflict('("time", "icao24") DO UPDATE SET callsign = EXCLUDED.callsign, lat = EXCLUDED.lat, lng = EXCLUDED.lng, altitude = EXCLUDED.altitude, velocity = EXCLUDED.velocity, heading = EXCLUDED.heading')
        .execute();

      console.log(`Flushed ${deduplicatedBatch.length} tracks into database (deduplicated from ${batch.length}).`);
    } catch (err) {
      console.error('Failed to flush ADSB tracks to database:', err);
    }
  }

  private cleanupStaleAircraft() {
    const now = Date.now();
    const staleLimitMs = 60000; // 60s TTL
    
    for (const [icao, state] of this.activeAircraft.entries()) {
      if (now - state.lastSeen > staleLimitMs) {
        this.activeAircraft.delete(icao);
        this.gateway.broadcastEviction(icao);
        console.log(`GC: Evicted stale aircraft ${icao} from live tracking cache.`);
      }
    }
  }

  /**
   * Geodesic Haversine distance formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Geodesic bearing formula
   */
  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  }

  async getMilitaryCivilSplit(): Promise<{ isMilitary: boolean; count: number }[]> {
    const data = await this.aircraftRepo.createQueryBuilder('ac')
      .select('ac.is_military', 'isMilitary')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ac.is_military')
      .getRawMany();
    
    return data.map((item) => ({
      isMilitary: !!item.isMilitary,
      count: parseInt(item.count, 10),
    }));
  }

  async getRecentEmergencySquawks(): Promise<AircraftTrack[]> {
    return this.trackRepo.find({
      where: [
        { squawk: '7700' },
        { squawk: '7600' },
        { squawk: '7500' }
      ],
      order: { time: 'DESC' },
      take: 10,
    });
  }
}
