import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'ranked_helper_counter_daily_stats' })
@Index('IDX_rh_counter_daily_lookup', ['bucketDate', 'map', 'mode', 'brawlerId', 'enemyBrawlerId'])
export class RankedHelperCounterDailyEntity {
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
  enemyBrawlerId!: number;

  @Column({ type: 'int' })
  games!: number;

  @Column({ type: 'int' })
  wins!: number;

  @Column({ type: 'timestamptz' })
  lastSeen!: Date;
}
