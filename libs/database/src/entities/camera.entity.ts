import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cameras')
export class Camera {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  code!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  kecamatan!: string | null;

  @Column({ type: 'double precision' })
  lat!: number;

  @Column({ type: 'double precision' })
  lng!: number;

  @Column({ type: 'varchar' })
  stream_url!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'varchar' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  last_checked_at!: Date | null;
}
