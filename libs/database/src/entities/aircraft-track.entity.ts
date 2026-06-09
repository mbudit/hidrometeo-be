import { Entity, PrimaryColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Aircraft } from './aircraft.entity.js';

@Entity('aircraft_tracks')
@Index(['icao24', 'time'])
@Index('IDX_aircraft_tracks_unsent', ['time'], { where: '"uploaded" = false OR "uploaded" IS NULL' })
export class AircraftTrack {
  @PrimaryColumn({ type: 'timestamptz' })
  time!: Date;

  @PrimaryColumn({ type: 'varchar', length: 6 })
  icao24!: string;

  @ManyToOne(() => Aircraft, (aircraft) => aircraft.tracks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'icao24' })
  aircraft!: Aircraft;

  @Column({ type: 'varchar', length: 8, nullable: true })
  callsign!: string | null;

  @Column({ type: 'double precision' })
  lat!: number;

  @Column({ type: 'double precision' })
  lng!: number;

  @Column({ type: 'double precision', nullable: true })
  altitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  velocity!: number | null;

  @Column({ type: 'double precision', nullable: true })
  heading!: number | null;

  @Column({ type: 'double precision', nullable: true })
  vertical_rate!: number | null;

  @Column({ type: 'varchar', length: 4, nullable: true })
  squawk!: string | null;

  @Column({ type: 'double precision', nullable: true })
  distance!: number | null;

  @Column({ type: 'boolean', default: false })
  uploaded!: boolean;
}
