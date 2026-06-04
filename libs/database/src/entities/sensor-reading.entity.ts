import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Station } from './station.entity.js';

@Entity('sensor_readings')
@Index(['station_id', 'time'])
export class SensorReading {
  @PrimaryColumn({ type: 'timestamptz' })
  time!: Date;

  @PrimaryColumn({ type: 'uuid' })
  station_id!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({ type: 'double precision', nullable: true })
  temperature!: number | null;

  @Column({ type: 'double precision', nullable: true })
  humidity!: number | null;

  @Column({ type: 'double precision', nullable: true })
  rainfall!: number | null;

  @Column({ type: 'double precision', nullable: true })
  wind_speed!: number | null;

  @Column({ type: 'double precision', nullable: true })
  wind_direction!: number | null;

  @Column({ type: 'double precision', nullable: true })
  pressure!: number | null;

  @Column({ type: 'double precision', nullable: true })
  battery_voltage!: number | null;
}
