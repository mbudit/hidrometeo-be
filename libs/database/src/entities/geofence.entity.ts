import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('geofences')
export class Geofence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb' })
  polygon_geojson!: any;

  @Column({ type: 'boolean', default: false })
  alert_on_enter!: boolean;

  @Column({ type: 'boolean', default: false })
  alert_on_exit!: boolean;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;
}
