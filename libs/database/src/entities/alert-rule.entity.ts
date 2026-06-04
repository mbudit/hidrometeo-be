import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DeviceNode } from './device-node.entity.js';

@Entity('alert_rules')
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  node_id!: string | null;

  @ManyToOne(() => DeviceNode, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'node_id' })
  node!: DeviceNode | null;

  @Column({ type: 'varchar' })
  metric!: string;

  @Column({ type: 'varchar' })
  operator!: string;

  @Column({ type: 'double precision' })
  threshold!: number;

  @Column({ type: 'varchar' })
  severity!: string;

  @Column('text', { array: true })
  notify_channels!: string[];

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;
}
