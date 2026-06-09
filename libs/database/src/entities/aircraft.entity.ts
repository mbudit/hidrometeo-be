import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { AircraftTrack } from './aircraft-track.entity.js';

@Entity('aircraft')
export class Aircraft {
  @PrimaryColumn({ type: 'varchar', length: 6 })
  icao24!: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  registration!: string | null;

  @Column({ type: 'varchar', length: 4, nullable: true })
  type_code!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  country_code!: string | null;

  @Column({ type: 'boolean', default: false })
  is_military!: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  first_seen!: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  last_seen!: Date;

  @OneToMany(() => AircraftTrack, (track) => track.aircraft)
  tracks!: AircraftTrack[];
}
