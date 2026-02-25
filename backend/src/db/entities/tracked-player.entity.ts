import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'tracked_players' })
export class TrackedPlayerEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // store canonical tag with leading '#', uppercase
    @Index({ unique: true })
    @Column({ type: 'varchar', length: 32 })
    tag!: string;

    @Column({ type: 'varchar', length: 64, nullable: true })
    name!: string | null;

    // "manual" | "leaderboard" etc.
    @Column({ type: 'varchar', length: 32, default: 'manual' })
    source!: string;

    @Column({ type: 'boolean', default: true })
    active!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}