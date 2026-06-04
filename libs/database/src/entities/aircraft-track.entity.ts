import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('aircraft_tracks')
@Index(['icao24', 'time'])
export class AircraftTrack {
  @PrimaryColumn({ type: 'timestamptz' })
  time!: Date;

  @PrimaryColumn({ type: 'varchar' })
  icao24!: string;

  @Column({ type: 'varchar', nullable: true })
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

  @Column({ type: 'varchar', nullable: true })
  squawk!: string | null;
}
