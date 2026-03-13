import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'battles' })
@Index('IDX_battles_map_battle_time', ['map', 'battleTime'])
@Index('IDX_battles_category_map_battle_time', ['category', 'map', 'battleTime'])
@Index('IDX_battles_category_mode_map_battle_time', ['category', 'mode', 'map', 'battleTime'])
export class BattleEntity {
    @PrimaryColumn({ type: 'varchar', length: 64 })
    battleId!: string;

    @Index()
    @Column({ type: 'timestamptz' })
    battleTime!: Date;

    @Index()
    @Column({ type: 'varchar', length: 32 })
    mode!: string;

    @Index()
    @Column({ type: 'varchar', length: 64 })
    map!: string;

    @Index()
    @Column({ type: 'varchar', length: 32 })
    battleType!: string;

    @Index()
    @Column({ type: 'varchar', length: 16, default: 'unknown' })
    category: 'ranked' | 'ladder' | 'special' | 'unknown';

    @Column({ type: 'varchar', length: 16, nullable: true })
    result!: string | null;

    @Column({ type: 'int', nullable: true })
    duration!: number | null;

    @Index()
    @Column({ type: 'varchar', length: 32 })
    observedFromTag!: string;

    @Column({ type: 'jsonb' })
    raw!: any;

    @CreateDateColumn()
    createdAt!: Date;
}
