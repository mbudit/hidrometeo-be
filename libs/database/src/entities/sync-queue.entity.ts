import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Station } from './station.entity.js';

@Entity('sync_queues')
export class SyncQueue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  station_id!: string | null;

  @ManyToOne(() => Station, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'station_id' })
  station!: Station | null;

  @Column({ type: 'jsonb' })
  payload!: any;

  @Column({ type: 'integer', default: 0 })
  attempt_count!: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_attempt_at!: Date | null;

  @Column({ type: 'varchar' })
  status!: string;

  @Column({ type: 'timestamptz' })
  created_at!: Date;
}
