import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'ranked_helper_synergy_daily_stats' })
@Index('IDX_rh_synergy_daily_lookup', ['bucketDate', 'map', 'mode', 'brawlerId', 'mateBrawlerId'])
export class RankedHelperSynergyDailyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  bucketDate!: string;

  @Column({ type: 'varchar', length: 64 })
  map!: string;

  @Column({ type: 'varchar', length: 32 })
  mode!: string;

  @Column({ type: 'int' })
  brawlerId!: number;

  @Column({ type: 'int' })
  mateBrawlerId!: number;

  @Column({ type: 'int' })
  games!: number;

  @Column({ type: 'int' })
  wins!: number;

  @Column({ type: 'timestamptz' })
  lastSeen!: Date;
}
