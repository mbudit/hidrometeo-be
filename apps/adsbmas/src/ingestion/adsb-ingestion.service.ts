import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';
import { TrackingService } from '../tracking/tracking.service.js';

@Injectable()
export class AdsbIngestionService implements OnModuleInit, OnModuleDestroy {
  private server!: net.Server;

  constructor(
    private readonly configService: ConfigService,
    private readonly trackingService: TrackingService,
  ) {}

  onModuleInit() {
    const port = this.configService.get<number>('ADSB_INGEST_PORT') ?? 30105;
    
    this.server = net.createServer((socket) => {
      console.log(`Ingestion: New feed connection from ${socket.remoteAddress}:${socket.remotePort}`);
      let buffer = '';

      socket.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split(/\r?\n/);
        
        // Save the last potentially incomplete line back to the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            this.parseSbsLine(line);
          }
        }
      });

      socket.on('error', (err) => {
        console.warn(`Ingestion: Socket error for client ${socket.remoteAddress}: ${err.message}`);
      });

      socket.on('close', () => {
        console.log(`Ingestion: Connection closed for client ${socket.remoteAddress}`);
      });
    });

    this.server.listen(port, '0.0.0.0', () => {
      console.log(`Ingestion: TCP Server listening for SBS-1 streams on port ${port}`);
    });
  }

  onModuleDestroy() {
    if (this.server) {
      this.server.close(() => {
        console.log('Ingestion: TCP Server stopped.');
      });
    }
  }

  /**
   * Parses standard SBS-1 BaseStation messages:
   * Format: MSG,transmission_type,session_id,aircraft_id,hex_ident,flight_id,date_gen,time_gen,date_log,time_log,callsign,altitude,ground_speed,track,lat,lng,vertical_rate,squawk,alert,emergency,spi,is_on_ground
   */
  private parseSbsLine(line: string) {
    try {
      const parts = line.trim().split(',');
      if (parts.length < 11) return;

      const msgType = parts[0];
      if (msgType !== 'MSG') return;

      const transType = parseInt(parts[1], 10);
      const icao24 = parts[4]?.trim().toLowerCase();
      if (!icao24 || icao24.length !== 6) return;

      const update: any = {};

      switch (transType) {
        case 1: // Identification (Callsign)
          if (parts[10]?.trim()) {
            update.callsign = parts[10].trim();
          }
          break;
        case 3: // Position Update
          if (parts[11]?.trim()) update.altitude = Math.round(parseFloat(parts[11]));
          if (parts[14]?.trim()) update.latitude = parseFloat(parts[14]);
          if (parts[15]?.trim()) update.longitude = parseFloat(parts[15]);
          break;
        case 4: // Velocity / Heading Update
          if (parts[12]?.trim()) update.velocity = Math.round(parseFloat(parts[12]));
          if (parts[13]?.trim()) update.heading = Math.round(parseFloat(parts[13]));
          break;
        case 5: // Altitude Update
          if (parts[11]?.trim()) update.altitude = Math.round(parseFloat(parts[11]));
          break;
        case 6: // Squawk Update
          if (parts[17]?.trim()) {
            update.squawk = parts[17].trim();
          }
          break;
        case 8: // Fallback
          if (parts[11]?.trim()) update.altitude = Math.round(parseFloat(parts[11]));
          break;
      }

      if (Object.keys(update).length > 0) {
        this.trackingService.updateState(icao24, update);
      }
    } catch (err) {
      console.error('Failed to parse SBS line:', line, err);
    }
  }
}
