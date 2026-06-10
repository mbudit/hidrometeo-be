import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AircraftTrack } from '@app/database';

@Injectable()
export class PlaybackService {
  constructor(
    @InjectRepository(AircraftTrack)
    private readonly trackRepo: Repository<AircraftTrack>,
  ) {}

  async getHistory(icao24: string, from: Date, to: Date): Promise<AircraftTrack[]> {
    const cleanIcao = icao24.trim().toLowerCase();
    return this.trackRepo.find({
      where: {
        icao24: cleanIcao,
        time: Between(from, to),
      },
      order: {
        time: 'ASC',
      },
      take: 2000, // Safe limit for map plotting
    });
  }
}
