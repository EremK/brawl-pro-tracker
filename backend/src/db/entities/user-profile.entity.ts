import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_profiles' })
export class UserProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 36 })
  userId!: string;

  @Index({ unique: true, where: '"playerTag" IS NOT NULL' })
  @Column({ type: 'varchar', length: 32, nullable: true })
  playerTag!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  playerName!: string | null;

  @Column({ type: 'int', nullable: true })
  profileIconId!: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  clubName!: string | null;

  @Column({ type: 'int', nullable: true })
  trophies!: number | null;

  @Column({ type: 'int', nullable: true })
  victories3v3!: number | null;

  @Column({ type: 'int', nullable: true })
  preferredDays!: number | null;

  @Column('int', { array: true, default: () => "'{}'" })
  preferredBrawlerIds!: number[];

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
