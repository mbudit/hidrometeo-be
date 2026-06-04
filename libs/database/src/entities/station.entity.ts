import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('stations')
export class Station {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  code!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  kecamatan!: string | null;

  @Column({ type: 'varchar', nullable: true })
  kelurahan!: string | null;

  @Column({ type: 'double precision' })
  lat!: number;

  @Column({ type: 'double precision' })
  lng!: number;

  @Column({ type: 'double precision', nullable: true })
  elevation!: number | null;

  @Column({ type: 'varchar' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  last_seen_at!: Date | null;
}
