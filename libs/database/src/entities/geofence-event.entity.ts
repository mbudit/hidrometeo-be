import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Geofence } from './geofence.entity.js';

@Entity('geofence_events')
export class GeofenceEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  geofence_id!: string;

  @ManyToOne(() => Geofence, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'geofence_id' })
  geofence!: Geofence;

  @Column({ type: 'varchar' })
  icao24!: string;

  @Column({ type: 'varchar', nullable: true })
  callsign!: string | null;

  @Column({ type: 'varchar' })
  event_type!: string;

  @Column({ type: 'timestamptz' })
  occurred_at!: Date;
}
