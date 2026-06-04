import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Station } from './station.entity.js';

@Entity('sensor_alerts')
export class SensorAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  station_id!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({ type: 'varchar' })
  parameter!: string;

  @Column({ type: 'double precision' })
  value!: number;

  @Column({ type: 'double precision' })
  threshold!: number;

  @Column({ type: 'varchar' })
  severity!: string;

  @Column({ type: 'timestamptz' })
  triggered_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at!: Date | null;
}
