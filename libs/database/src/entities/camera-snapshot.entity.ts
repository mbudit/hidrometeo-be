import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Camera } from './camera.entity.js';

@Entity('camera_snapshots')
export class CameraSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  camera_id!: string;

  @ManyToOne(() => Camera, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'camera_id' })
  camera!: Camera;

  @Column({ type: 'varchar' })
  file_path!: string;

  @Column({ type: 'timestamptz' })
  captured_at!: Date;

  @Column({ type: 'varchar' })
  triggered_by!: string;
}
