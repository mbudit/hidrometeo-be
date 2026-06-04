import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('device_nodes')
export class DeviceNode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  hostname!: string;

  @Column({ type: 'varchar' })
  ip!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'varchar', nullable: true })
  location!: string | null;

  @Column({ type: 'varchar', nullable: true })
  prometheus_job!: string | null;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;
}
